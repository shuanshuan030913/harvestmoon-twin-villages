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
import { extractPortrait, stripEditorialNotes } from './entryTransforms.js'
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
      entry.loathesLinks = resolveItemStrings(entry.loathes, itemIndex, warnings, sourceLabel)
      entry.ingredientsLinks = resolveItemStrings(entry.ingredients, itemIndex, warnings, sourceLabel)

      // 條目明細不呈現資料查證註記（guides 保留——那是攻略文章的沿革記錄）
      const displayContent = name === 'guides' ? entry.content : stripEditorialNotes(entry.content)
      if (name === 'characters') {
        entry.portrait = extractPortrait(entry.content, entry.name, BASE_PATH)
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
      entry.html = marked.parse(withImagePaths)
      entry.plain = htmlToPlainText(entry.html)
      delete entry.content
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
