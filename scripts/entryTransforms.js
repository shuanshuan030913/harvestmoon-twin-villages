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

// 節慶「## 舉辦時間」段與 day/season/location 欄重複（U19e，2026-07-19，19 篇中
// 14 篇比對一致，可整段剝）；呼叫端只對「無 occurrences 欄」的條目呼叫本函式——
// 料理大會/花之日用 occurrences 表達多重日期（C6），entry 頁目前唯一顯示管道就是
// 這段，不可剝。音樂節 heading 名是「舉辦時間與地點」不命中、內文另有地點矛盾的查證
// 註記；冬之感謝祭/春之感謝祭無此段（location 為「原文未提供」佔位值，屬 C15 範疇）。
const FESTIVAL_TEMPLATE_HEADINGS = new Set(['舉辦時間'])

export function stripFestivalScheduleSection(markdown) {
  return stripSectionsByHeading(markdown, FESTIVAL_TEMPLATE_HEADINGS)
}

// 村莊「## 商店」段的商店清單 bullet 與 shops 欄全額重複（U19f，2026-07-19，
// villages 先補 shops 欄才剝，避免資訊消失）；段落開頭「村內共N家商店…見[[guide]]」
// 是獨有導覽句（家數統計＋連到商店指南），只剝清單 bullet，整段標題與導覽句保留。
export function stripVillageShopBullets(markdown) {
  const lines = markdown.split('\n')
  const kept = []
  let inShopSection = false
  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line)
    if (heading) {
      inShopSection = heading[1] === '商店'
      kept.push(line)
      continue
    }
    if (inShopSection && /^-\s/.test(line)) continue
    kept.push(line)
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim()
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

// 作物條目的規格 bullet 列（購買價/成長天數/澆水次數/賣價/可否重複收成）與
// buy_price/grow_days/water_times/sell_price/regrowable+regrow_days 欄全額重複
// （U19d，2026-07-20，C14 補齊 water_times/seed_shop 欄後解除 blocked；45 篇
// 逐篇核對零例外）。開頭句（作物類型／花卉加工連結／種植面積等）為獨有內容，
// 未欄位化，不動；「賣價」bullet 的 5★ 語意已由 U23① label 改「賣價（5★）」承接，
// 不會靜默丟失。茶樹的季節分價說明是獨有內容（sell_price 只存代表值），
// 寫法與這 5 個樣板皆不同，正則天然不命中，維持原樣。
const CROP_STAT_BULLETS = [
  /^-\s*(種子|樹苗)購買價：[\d,]+G\s*$/,
  /^-\s*成長天數：\d+(?:[～-]\d+)?\s*天(?:（範圍依鋤頭等級而異，等級越高天數越接近下限）)?\s*$/,
  /^-\s*澆水次數：\d+\s*次\s*$/,
  /^-\s*賣價：[\d,]+G（5 星／最高品質賣價，非基礎 1 星賣價）\s*$/,
  /^-\s*(不可重複收成|可重複收成，每\s*[\d～-]+\s*天再生一次)\s*$/,
]

export function stripCropStatBullets(markdown) {
  return markdown
    .split('\n')
    .filter((line) => !CROP_STAT_BULLETS.some((re) => re.test(line)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// 昆蟲條目「- 出貨賣價：NG」bullet 與 sell_price 欄全額重複（U19b，2026-07-19，
// 85 篇全數比對數值一致無例外）；地區代碼連結是獨有內容，不動。
const INSECT_SELL_PRICE_BULLET = /^-\s*出貨賣價：\d+G\s*$/

export function stripInsectSellPriceBullet(markdown) {
  return markdown
    .split('\n')
    .filter((line) => !INSECT_SELL_PRICE_BULLET.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// 開頭句「，昆蟲顏色為X」子句與新增的 color 欄重複（C16，2026-07-20，補欄後
// 解除 U19b 當時「顏色未欄位化」的限制）；80 篇逐一核對零例外。只移除這個子句，
// 保留句子其餘部分（地區代碼連結指引）與少數帶「，鑑定盒顏色為Y」的獨有附加子句
// （鑑定盒顏色是選單顯示用的另一件事，不是昆蟲本身顏色，不可誤刪）；
// 5 篇青蛙來源本就沒有顏色資料（無 color 欄），這個子句天然不存在，不受影響。
const INSECT_COLOR_CLAUSE = /，昆蟲顏色為[^，。]+/

export function stripInsectColorClause(markdown) {
  return markdown.replace(INSECT_COLOR_CLAUSE, '')
}

// items collection 橫跨 5 個來源子目錄，樣板依來源不同（U19c，2026-07-19）；
// 這裡只登記已逐篇驗證過的樣板，命中才剝，不命中（含其他子目錄的寫法）維持原樣。
const ITEM_TEMPLATES = [
  {
    // 山道採集物（basics/items，35 篇中 25 篇比對一致）：地點/季節已由欄位承接；
    // 賣價品質註記（1.5☆／隨遊戲年份成長）為獨有語意，隨賣價 bullet 一併保留
    intro: /^.+（.+）是\s*\[\[山道系統\|山道\]\]\s*的採集物。$/,
    stripIntro: true,
    bulletsToStrip: [/^-\s*採集季節：.+$/],
  },
  {
    // 雜貨店販售食材／飼料（basics/items，9 篇）：購買價已由新增的 buy_price 欄
    // 承接，販售處（哪家店老闆）未結構化，保留
    intro: /^.+（.+）是雜貨店販售的(料理食材|飼料)。$/,
    stripIntro: true,
    bulletsToStrip: [/^-\s*購買價：\d+\s*G\s*$/],
  },
  {
    // 花束／香水（farming/items，13 篇）：intro 句「代表顏色為X」「也可直接在店內
    // 購買」是獨有內容（顏色未欄位化），保留 intro 不剝；「所需花材」未欄位化保留；
    // 「賣價」「商店購買價」bullet 純數值，與 sell_price／buy_price 欄逐篇比對吻合
    intro: /^.+（.+）是藍鈴村（ブルーベル村）卡米爾鮮花店（カミル・フルール）的加工(花束|香水)/,
    stripIntro: false,
    bulletsToStrip: [/^-\s*賣價：.+$/, /^-\s*商店購買價：\d+\s*G\s*$/],
  },
  {
    // 蜂箱蜂蜜（livestock/items，6 篇，不含取得方式特殊的蜂王漿）：intro 純為
    // 「村＋蜂箱＋收穫物」框架，與 location 欄（蜂箱（藍鈴村自宅增築））全額重複，
    // 剝除；「取得條件」（各蜂蜜取得方式不同）與「賣價（5.0☆）」的星級註記
    // 未欄位化，bullet 整列保留
    intro: /^.+（.+）是藍鈴村（ブルーベル村）蜂箱（養蜂）的收穫物。$/,
    stripIntro: true,
    bulletsToStrip: [],
  },
  {
    // 動物副產品（livestock/items，11 篇：蛋/奶/羊毛/羊駝毛）：intro 的收穫頻率、
    // 加工用途未欄位化保留；「賣價」bullet 與 sell_price 欄字串逐篇比對完全一致
    // （含星級區間），安全剝除
    intro: /^.+（.+）是\s*\[\[.+?\]\]\s*的副產品。/,
    stripIntro: false,
    bulletsToStrip: [/^-\s*賣價：.+$/],
  },
]

export function stripItemsTemplateIntro(markdown) {
  const firstHeading = markdown.search(/^##\s/m)
  const body = firstHeading === -1 ? markdown : markdown.slice(0, firstHeading)
  const lines = body.split('\n')
  const introLine = lines.find((line) => line.trim() !== '')
  const template = ITEM_TEMPLATES.find((t) => t.intro.test(introLine?.trim() ?? ''))
  if (!template) return markdown

  const kept = lines.filter((line) => {
    if (template.stripIntro && line === introLine) return false
    return !template.bulletsToStrip.some((re) => re.test(line.trim()))
  })
  const rest = firstHeading === -1 ? '' : markdown.slice(firstHeading)
  return `${kept.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n\n${rest}`.trim()
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

// guide 內文開頭的 `# 標題` 與 GuidePage 自己渲染的 `<h1>{entry.title}</h1>` 重複
// （53 篇中 38 篇有這行、15 篇本來就沒有）；抽出內文標題文字取代 frontmatter title
// 顯示——內文標題有時比 frontmatter title 豐富（如「服裝系統（衣装システム）攻略」
// 含日文名，frontmatter title 只有「服裝系統攻略」），不能無腦丟棄改用 frontmatter
// 值，否則會漏資訊；沒有這行的 15 篇維持用 frontmatter title（呼叫端 `?? entry.title`）。
export function extractAndStripLeadingHeading(markdown) {
  const match = /^\s*#\s+(.+?)\s*\n/.exec(markdown)
  if (!match) return { content: markdown, heading: undefined }
  return { content: markdown.slice(match[0].length).trimStart(), heading: match[1] }
}

// 外部連結一律另開新分頁（2026-07-19 使用者裁決）：marked 產出的內文 <a> 中
// http(s) 開頭者補 target/rel；站內連結（#/…）不動。UI 元件的出處列連結已各自
// 帶 target="_blank"，這裡補的是 build 產物 entry.html 的缺口。
export function openExternalLinksInNewTab(html) {
  return html.replace(
    /<a (href="https?:\/\/[^"]*")/g,
    '<a target="_blank" rel="noreferrer" $1',
  )
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

// U25（2026-07-20）：把 characters 既有的「來源」段整併通用化到其餘 7 個 collection。
// 比 extractSources 嚴格——要求每個 bullet「整行」都符合標準格式，不允許帶額外文字
// （逐篇掃描發現 402 篇中 95 篇的 bullet 帶查證補述，如「（2026-07-12 curl 重核對原文
// 補日文名）」「（購買價、妊娠費用）」，這類補述是判斷「這條來源涵蓋哪些資料」的
// 真實資訊，不是編輯註記，剝到頁尾出處列會被結構化格式吃掉、靜默丟失）。
// 回傳 undefined＝沒有「## 來源」段（不需處理）；null＝段存在但至少一個 bullet
// 不符標準格式（呼叫端應保留原段＋記警告）；陣列＝可安全剝除。
const STANDARD_SOURCE_BULLET = /^-\s*\[([^\]]+)\]\(([^)]+)\)(?:，擷取於\s*(\d{4}-\d{2}-\d{2}))?\s*$/

export function extractStandardSources(markdown) {
  const section = /^##\s+來源\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(markdown)
  if (!section) return undefined
  const lines = section[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))
  if (lines.length === 0) return undefined

  const sources = []
  for (const line of lines) {
    const match = STANDARD_SOURCE_BULLET.exec(line)
    if (!match) return null
    const [, title, url, retrieved] = match
    sources.push(retrieved ? { title, url, retrieved } : { title, url })
  }
  return sources
}

export function stripSourcesSection(markdown) {
  return stripSectionsByHeading(markdown, new Set(['來源']))
}
