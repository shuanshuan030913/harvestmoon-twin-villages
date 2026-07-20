import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { marked } from 'marked'
import { buildWikilinkTable, resolveWikilinks } from './wikilinks.js'
import { copyContentImages, rewriteImagePaths } from './images.js'
import { BASE_PATH } from '../base-path.js'
import {
  findDuplicateSlugs,
  validateGrowDays,
  validateRequiredFields,
  validateTreatRequirements,
} from './validate.js'
import { buildItemIndex, resolveItemStrings } from './itemIndex.js'
import { attachGiftFans } from './giftFans.js'
import {
  extractAndStripLeadingHeading,
  extractPortrait,
  extractRetrievedDate,
  extractSources,
  extractStandardSources,
  openExternalLinksInNewTab,
  resolveFamilyLinks,
  stripCharacterIntro,
  stripCharacterTemplateSections,
  stripCropStatBullets,
  stripEditorialNotes,
  stripFestivalScheduleSection,
  stripFishIntro,
  stripInsectSellPriceBullet,
  stripItemsTemplateIntro,
  stripPortraitImage,
  stripRecipeTemplateSections,
  stripSourcesSection,
  stripVillageShopBullets,
} from './entryTransforms.js'
import { buildManifest, computeContentHash, summarizeWarnings } from './manifest.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../content')
const OUTPUT_DIR = path.resolve(__dirname, '../src/data')
const PUBLIC_IMAGES_DIR = path.resolve(__dirname, '../public/images')

// collection → 來源資料夾（可多個），見 .spec/modules/content-pipeline.md
const COLLECTION_DIRS = {
  characters: ['characters'],
  recipes: ['cooking/recipes'],
  crops: ['farming/crops'],
  fishes: ['fishing/fishes'],
  // items 為跨系統物品 collection（spec 2026-07-07 裁決：日後其他系統道具也歸此）
  items: ['fishing/items', 'basics/items', 'farming/items', 'life/items', 'livestock/items'],
  insects: ['bugs/insects'],
  animals: ['livestock/animals'],
  minerals: ['mining/minerals'],
  festivals: ['life/festivals'],
  villages: ['villages'],
  guides: [
    'cooking/guide',
    'farming/guide',
    'fishing/guide',
    'bugs/guide',
    'livestock/guide',
    'mining/guide',
    'life/guide',
    'romance/guide',
    'basics',
  ],
}

// U25（2026-07-20）：把 characters 既有的「## 來源」整併頁尾出處列做法通用化到這 7 個
// collection（villages 無此段、recipes 走 frontmatter source、characters/guides 已各自處理）
const SOURCES_SECTION_COLLECTIONS = new Set(['fishes', 'insects', 'items', 'crops', 'minerals', 'festivals', 'animals'])

// 料理分類 → 該分類總覽 guide 的 slug（明細頁「分類」值連過去；沙拉與湯共用同一篇）
const RECIPE_CATEGORY_GUIDES = {
  主食: '主食類食譜',
  沙拉: '沙拉類與湯類食譜',
  湯: '沙拉類與湯類食譜',
  拼盤: '拼盤類料理總覽',
  甜點: '甜點類食譜',
  其他: '其他類食譜',
}

function htmlToPlainText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readMarkdownDir(dirPath) {
  if (!fs.existsSync(dirPath)) return []
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
      const slug = file.replace(/\.md$/, '')
      const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8')
      const { data, content } = matter(raw)
      return { slug, ...data, content }
    })
}

export function buildCollections() {
  const collections = {}
  for (const [collectionName, relDirs] of Object.entries(COLLECTION_DIRS)) {
    collections[collectionName] = relDirs.flatMap((relDir) =>
      readMarkdownDir(path.join(CONTENT_DIR, relDir)),
    )
  }
  return collections
}

function writeCollection(name, entries) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.json`), `${JSON.stringify(entries, null, 2)}\n`)
}

function computeHref(collectionName, entry) {
  if (collectionName === 'guides') return `#/guide/${entry.system}/${entry.slug}`
  return `#/c/${collectionName}/${entry.slug}`
}

function main() {
  copyContentImages(path.join(CONTENT_DIR, 'images'), PUBLIC_IMAGES_DIR)

  const collections = buildCollections()
  const allEntries = Object.values(collections).flat()

  const duplicateSlugs = findDuplicateSlugs(allEntries)
  if (duplicateSlugs.length > 0) {
    throw new Error(`slug 重複，全站須唯一：${duplicateSlugs.join('、')}`)
  }

  const lookupEntries = Object.entries(collections).flatMap(([name, entries]) =>
    entries.map((entry) => ({
      slug: entry.slug,
      name: entry.name,
      title: entry.title,
      href: computeHref(name, entry),
    })),
  )
  const { table, warnings } = buildWikilinkTable(lookupEntries)
  const itemIndex = buildItemIndex(collections, computeHref)

  for (const [name, entries] of Object.entries(collections)) {
    for (const entry of entries) {
      const sourceLabel = `${name}/${entry.slug}`
      warnings.push(
        ...validateRequiredFields(name, entry, sourceLabel),
        ...validateGrowDays(entry, sourceLabel),
        ...validateTreatRequirements(entry, sourceLabel),
      )

      // 喜好/食材字串 → 站內連結欄位（build 時解析，前端只渲染）
      entry.lovesLinks = resolveItemStrings(entry.loves, itemIndex, warnings, sourceLabel)
      entry.likesLinks = resolveItemStrings(entry.likes, itemIndex, warnings, sourceLabel)
      entry.hatesLinks = resolveItemStrings(entry.hates, itemIndex, warnings, sourceLabel)
      entry.loathesLinks = resolveItemStrings(entry.loathes, itemIndex, warnings, sourceLabel)
      entry.ingredientsLinks = resolveItemStrings(entry.ingredients, itemIndex, warnings, sourceLabel)

      // 條目明細不呈現資料查證註記（guides 保留——那是攻略文章的沿革記錄）
      let displayContent = name === 'guides' ? entry.content : stripEditorialNotes(entry.content)
      if (name === 'guides') {
        // 內文開頭「# 標題」與 GuidePage 自己渲染的 <h1> 重複；抽出內文標題文字
        // （可能比 frontmatter title 豐富，如含日文名）取代顯示，避免重複又不漏資訊。
        const { content: withoutHeading, heading } = extractAndStripLeadingHeading(displayContent)
        displayContent = withoutHeading
        if (heading) entry.displayTitle = heading
      }
      if (name === 'characters') {
        // 條目頁以原始出處角色卡為明細規格（2026-07-19 使用者裁決）：
        // 頭像去重、禮物/約會樣板段剝除（frontmatter 全額覆蓋）、來源整併到頁尾出處列
        entry.portrait = extractPortrait(entry.content, entry.name, BASE_PATH)
        entry.sources = extractSources(displayContent)
        entry.familyLinks = resolveFamilyLinks(entry.family, table, warnings, sourceLabel)
        if (entry.portrait) {
          displayContent = stripPortraitImage(displayContent, entry.name)
        }
        displayContent = stripCharacterIntro(stripCharacterTemplateSections(displayContent))
      }
      if (name === 'recipes') {
        // 樣板段落與明細欄位重複（2026-07-18 使用者回饋：條目頁重複難讀），
        // 剝除前先抽擷取日期供頁尾出處行；分類值連到對應總覽 guide。
        entry.retrieved ??= extractRetrievedDate(entry.content)
        displayContent = stripRecipeTemplateSections(displayContent)
        const guide = collections.guides.find(
          (g) => g.slug === RECIPE_CATEGORY_GUIDES[entry.category],
        )
        if (guide) {
          entry.guideHref = computeHref('guides', guide)
        } else {
          warnings.push(`料理分類「${entry.category}」查無對應總覽 guide（來源：${sourceLabel}）`)
        }
      }
      if (name === 'fishes') {
        // 開頭句可由 season/location/condition/sell_price 四欄推導，明細頁已顯示
        // （U19a，2026-07-19）；不符樣板的例外（獨有捕捉方式等）保留原句。
        displayContent = stripFishIntro(displayContent)
      }
      if (name === 'insects') {
        // 「出貨賣價」bullet 與 sell_price 欄重複，明細頁已顯示（U19b，2026-07-19）；
        // 開頭句（顏色／地區代碼連結）為獨有內容，C16 補欄前不動。
        displayContent = stripInsectSellPriceBullet(displayContent)
      }
      if (name === 'items') {
        // 5 個來源子目錄樣板不同，只剝已驗證過的樣板（U19c，2026-07-19）；
        // 其餘子目錄（life 加工品/farming 花束香水/fishing 戰利品/livestock 蜂蜜）
        // 尚未逐篇驗證，維持原樣待後續子項處理。
        displayContent = stripItemsTemplateIntro(displayContent)
      }
      if (name === 'festivals' && !entry.occurrences) {
        // 「## 舉辦時間」段與 day/season/location 欄重複，明細頁已顯示（U19e，
        // 2026-07-19）；有 occurrences 欄的（花之日/料理大會）該段是唯一顯示管道，不剝。
        displayContent = stripFestivalScheduleSection(displayContent)
      }
      if (name === 'villages') {
        // 「## 商店」段清單與 shops 欄重複，明細頁已顯示（U19f，2026-07-19，
        // collectionConfigs 同步補 shops 欄）；段落導覽句（家數＋連到商店指南）保留。
        displayContent = stripVillageShopBullets(displayContent)
      }
      if (name === 'crops') {
        // 規格 bullet（購買價/成長天數/澆水次數/賣價/可否重複收成）與明細頁欄位重複
        // （U19d，2026-07-20，C14 補欄後解除 blocked）；開頭句獨有內容不動。
        displayContent = stripCropStatBullets(displayContent)
      }
      if (name === 'crops' || name === 'minerals' || name === 'villages') {
        // 內文開頭「# 標題」與 EntryPage 自己渲染的 <h1> 重複（U24，2026-07-20）；
        // 逐篇核對 66 篇皆與 name（name_jp）完全一致、無額外資訊，直接剝除，
        // 不像 guides 需要抽出文字回填 displayTitle（entry 頁標題已由 name/name_jp 承接）。
        displayContent = extractAndStripLeadingHeading(displayContent).content
      }
      if (SOURCES_SECTION_COLLECTIONS.has(name)) {
        // 「## 來源」段整併到頁尾弱化出處列，對齊 characters 既有 UI（U25，2026-07-20）；
        // 安全閥：extractStandardSources 回傳 null 代表段內至少一個 bullet 帶額外文字
        // （如查證補述），保留原段＋記警告，不靜默丟失；undefined 代表本來就沒有這段。
        const sources = extractStandardSources(displayContent)
        if (sources) {
          entry.sources = sources
          displayContent = stripSourcesSection(displayContent)
        } else if (sources === null) {
          warnings.push(`「## 來源」段格式不符標準 bullet，未整併頁尾出處列（來源：${sourceLabel}）`)
        }
      }

      // wikilink 必須在 marked 轉換「前」解析：[[target|alias]] 的 `|`
      // 若留到 html 階段才處理，會被 marked 誤判為 markdown 表格的欄位分隔符。
      const resolvedMarkdown = resolveWikilinks(
        displayContent,
        table,
        warnings,
        `${name}/${entry.slug}`,
      )
      const withImagePaths = rewriteImagePaths(resolvedMarkdown, BASE_PATH)
      entry.html = openExternalLinksInNewTab(marked.parse(withImagePaths))
      entry.plain = htmlToPlainText(entry.html)
      delete entry.content
    }
    if (name === 'characters') {
      // characters 的四個 *Links 欄位已全數解析完成，且其餘 collection（recipes/crops/
      // fishes/items/insects/minerals）尚未走到各自的 writeCollection，此刻反向歸戶
      // 送禮名單，目標條目物件會在被序列化前就帶上 giftFans（U27，2026-07-20）。
      attachGiftFans(collections, computeHref)
    }
    writeCollection(name, entries)
    console.log(`${name}.json 產出 ${entries.length} 筆`)
  }

  const manifest = buildManifest({
    collections,
    warnings,
    contentHash: computeContentHash(CONTENT_DIR),
    builtAt: new Date().toISOString(),
  })
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )

  if (warnings.length > 0) {
    console.log(`\n共 ${warnings.length} 則警告：`)
    for (const [category, count] of summarizeWarnings(warnings)) {
      console.log(`  - ${category}：${count}`)
    }
  }
}

main()
