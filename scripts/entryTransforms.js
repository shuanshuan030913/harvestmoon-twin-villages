// 條目呈現層轉換：資料查證註記剝除、角色頭像抽取。
// content/ 檔案本身不動（那是編輯者的查證紀錄），只影響 build 產物。

import { parseItemString } from '../src/utils/itemString.js'

// 內容查證/編輯用註記的 blockquote 標籤字彙：`> **命名說明**：…`、`> **資料修正…**`
// 等只服務內容維護者，開發期不呈現在條目明細頁（2026-07-14 使用者裁決）。
const EDITORIAL_LABEL = /^>\s*\*\*(關於|[^*]*(說明|修正|沿革|狀態|矛盾))[^*]*\*\*/

export function stripEditorialNotes(markdown) {
  const lines = markdown.split('\n')
  const kept = []
  let skipping = false

  for (const line of lines) {
    if (EDITORIAL_LABEL.test(line)) {
      skipping = true
      continue
    }
    if (skipping) {
      // blockquote 連續行（含 `>` 空行）皆屬同一註記
      if (/^>/.test(line.trim()) || line.trim() === '') {
        if (line.trim() === '') skipping = false
        continue
      }
      skipping = false
    }
    kept.push(line)
  }
  return kept.join('\n')
}

// 樣板段落剝除共用邏輯：`## 標題` 命中集合者整段（至下一個 ## 前）移除。
function stripSectionsByHeading(markdown, headings, { dropLine = () => false } = {}) {
  const lines = markdown.split('\n')
  const kept = []
  let skippingSection = false

  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line)
    if (heading) {
      skippingSection = headings.has(heading[1])
      if (skippingSection) continue
    }
    if (skippingSection) continue
    if (dropLine(line)) continue
    kept.push(line)
  }

  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// 料理條目的樣板段落（開頭句、## 食譜、## 相關、## 來源）內容全數可由 frontmatter
// 推導，明細頁已用結構化欄位呈現；剝除後只留條目獨有章節（如「食譜改寫與可追加材料」）。
const RECIPE_TEMPLATE_HEADINGS = new Set(['食譜', '相關', '來源'])
// 開頭句樣板：「X（Y）是Z類（W）料理，…」（2026-07-18 驗證全 273 篇皆符合）
const RECIPE_INTRO = /^.+（.*）是.+類（.+）料理，/

export function stripRecipeTemplateSections(markdown) {
  return stripSectionsByHeading(markdown, RECIPE_TEMPLATE_HEADINGS, {
    dropLine: (line) => RECIPE_INTRO.test(line.trim()),
  })
}

// 角色條目以原始出處的「角色卡」為明細規格（2026-07-19 使用者裁決）：禮物、約會、
// 家庭關係、解鎖條件全數可由 frontmatter 推導（C11 補齊 debut/family/residence 後），
// 來源移到頁尾出處列，內文只留獨有內容（開頭句、每日路線時間表、任務等特殊段）。
const CHARACTER_TEMPLATE_HEADINGS = new Set([
  '禮物攻略',
  '禮物攻略重點',
  '約會資訊',
  '家庭關係',
  '解鎖條件',
  '來源',
])

export function stripCharacterTemplateSections(markdown) {
  return stripSectionsByHeading(markdown, CHARACTER_TEMPLATE_HEADINGS)
}

// 魚類條目開頭句可由 season/location/condition/sell_price 四欄推導，明細頁已用
// 結構化欄位呈現（U19a，2026-07-19，64 篇逐篇驗證）。不比對此樣板的例外（如短種螃蟹
// 「徒手抓取」——捕捉方式與村莊資訊未結構化，屬獨有內容）保留原句不剝。
const FISH_INTRO = /^.+（.+）(可在.+釣獲，季節為.+|依地點而異：.+)。5★\s*品質賣價.+。$/

export function stripFishIntro(markdown) {
  const firstHeading = markdown.search(/^##\s/m)
  const intro = (firstHeading === -1 ? markdown : markdown.slice(0, firstHeading)).trim()
  if (!FISH_INTRO.test(intro)) return markdown
  return firstHeading === -1 ? '' : markdown.slice(firstHeading).trim()
}

// 昆蟲條目「- 出貨賣價：NG」bullet 與 sell_price 欄全額重複（U19b，2026-07-19，
// 85 篇全數比對數值一致無例外）；開頭句「昆蟲顏色為X」與地區代碼連結是獨有內容
// （顏色未欄位化，C16 blocked），不動。
const INSECT_SELL_PRICE_BULLET = /^-\s*出貨賣價：\d+G\s*$/

export function stripInsectSellPriceBullet(markdown) {
  return markdown
    .split('\n')
    .filter((line) => !INSECT_SELL_PRICE_BULLET.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// family 欄位「關係：中文（日文）」→ 站內角色連結（build 端解析，前端 EntryPage
// 資訊列渲染，C11）。查無站內角色時保留純文字＋警告，不可用猜的連過去。
export function resolveFamilyLinks(family, wikilinkTable, warnings, sourceLabel) {
  if (!family) return undefined

  return family.map((raw) => {
    const sepIndex = raw.indexOf('：')
    if (sepIndex === -1) {
      warnings.push(`family 欄位格式不符「${raw}」（來源：${sourceLabel}）`)
      return { relation: raw, zh: raw, jp: null, href: null }
    }
    const relation = raw.slice(0, sepIndex)
    const parsed = parseItemString(raw.slice(sepIndex + 1))
    const zh = parsed?.zh ?? raw.slice(sepIndex + 1)
    const jp = parsed?.jp ?? null
    const target = wikilinkTable.get(zh)
    if (!target) {
      warnings.push(`family 查無站內角色「${zh}」（來源：${sourceLabel}）`)
    }
    return { relation, zh, jp, href: target?.href ?? null }
  })
}

// 角色開頭段是抽資料時自寫的編輯句（原始出處無介紹文，2026-07-19 WebFetch 查證），
// 內容（生日/家人/所屬店家）皆由拍立得與角色卡欄位承接，整段剝除（使用者裁決）。
export function stripCharacterIntro(markdown) {
  const firstHeading = markdown.search(/^##\s/m)
  if (firstHeading === -1) return ''
  return markdown.slice(firstHeading).trim()
}

// 「擷取於 YYYY-MM-DD」寫在內文來源區塊；剝除樣板前先抽出，供頁尾出處行顯示。
export function extractRetrievedDate(markdown) {
  const match = /擷取於\s*(\d{4}-\d{2}-\d{2})/.exec(markdown)
  return match ? match[1] : undefined
}

// 角色條目的第一張「alt 以角色名開頭」的圖片視為頭像（路線時間來源的首圖慣例）。
export function extractPortrait(markdown, name, basePath) {
  if (!name) return undefined
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  for (const match of markdown.matchAll(imagePattern)) {
    const [, alt, path] = match
    if (alt.startsWith(name)) {
      return path.replace(/^(\.\.\/)+images\//, `${basePath}images/`)
    }
  }
  return undefined
}

// 頭像抽出後從內文移除同一張圖（判定條件與 extractPortrait 一致），
// 避免拍立得與內文重複顯示（2026-07-19 使用者回饋）。其他圖（居住地點外觀等）保留。
export function stripPortraitImage(markdown, name) {
  if (!name) return markdown
  let removed = false
  return markdown
    .split('\n')
    .filter((line) => {
      if (removed) return true
      const match = /^!\[([^\]]*)\]\([^)]+\)\s*$/.exec(line.trim())
      if (match && match[1].startsWith(name)) {
        removed = true
        return false
      }
      return true
    })
    .join('\n')
}

// 「## 來源」段的 bullet 列表 → 結構化出處（頁尾出處列用，支援多來源）。
// bullet 慣例：`- [標題](url)，擷取於 YYYY-MM-DD`（日期選填）。
export function extractSources(markdown) {
  const section = /^##\s+來源\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(markdown)
  if (!section) return undefined
  const sources = []
  const bullet = /^-\s*\[([^\]]+)\]\(([^)]+)\)(?:，擷取於\s*(\d{4}-\d{2}-\d{2}))?/gm
  for (const match of section[1].matchAll(bullet)) {
    const [, title, url, retrieved] = match
    sources.push(retrieved ? { title, url, retrieved } : { title, url })
  }
  return sources.length > 0 ? sources : undefined
}
