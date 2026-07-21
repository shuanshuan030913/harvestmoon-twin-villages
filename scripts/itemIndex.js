import { parseItemString } from '../src/utils/itemString.js'
import { GAME_SPECIES_CATEGORIES, parseCategoryIngredient, parseCategoryReference } from './ingredientCategories.js'

// 全站物品可能來源的 collection：喜好/食材字串解析時查找的範圍。
export const ITEM_INDEX_COLLECTIONS = ['crops', 'recipes', 'fishes', 'items', 'insects', 'minerals']

// U21（2026-07-21）：characters 禮物欄類別參照裡，有一批不需要（也不該）手抄固定清單——
// 直接等於某個 collection 全部條目（「所有農作物」「昆蟲類（昆蟲全部）」），或是可以從
// 既有結構化欄位／name_jp 精確過濾出來（recipes 的 category 欄、items/recipes 的 name_jp
// 關鍵字）。手抄清單日後內容增修就會過期，這批改成 build 當下動態算，來源資料變動時自動同步。
// 每條規則的 test 都是可驗證的字串比對，不含任何主觀判斷；篩選依據已用實際 JSON 資料核對過
// （見 .spec/todo.md U21 完成記錄），非猜測。
const DYNAMIC_CATEGORY_RULES = [
  { key: '農作物', collections: ['crops'] },
  { key: '昆蟲', collections: ['insects'] },
  { key: '礦石', collections: ['minerals'] },
  { key: '魚', collections: ['fishes'] },
  { key: '卵', collections: ['items'], test: (e) => e.name_jp?.includes('卵') },
  { key: 'ミルク', collections: ['items', 'recipes'], test: (e) => e.name_jp?.includes('ミルク') },
  { key: 'お茶', collections: ['items'], test: (e) => e.name_jp?.endsWith('茶缶') },
  { key: '紅茶', collections: ['items'], test: (e) => e.name_jp?.includes('紅茶') },
  { key: 'お酒', collections: ['items', 'recipes'], test: (e) => e.name_jp?.includes('酒') },
  { key: 'ジュース', collections: ['items', 'recipes'], test: (e) => e.name_jp?.includes('ジュース') },
  { key: 'カレー', collections: ['recipes'], test: (e) => e.name_jp?.includes('カレー') },
  { key: 'フォンデュ系の料理', collections: ['recipes'], test: (e) => e.name_jp?.includes('フォンデュ') },
  { key: '湯系料理', collections: ['recipes'], test: (e) => e.category === '湯' },
  { key: 'サラダ', collections: ['recipes'], test: (e) => e.category === '沙拉' },
  { key: 'お菓子', collections: ['recipes'], test: (e) => e.category === '甜點' },
  { key: '生チョコ系のお菓子', collections: ['recipes'], test: (e) => e.name_jp?.includes('生チョコ') },
  {
    key: '牛乳を使った料理',
    collections: ['recipes'],
    test: (e) => (e.ingredients ?? []).some((ing) => /牛乳|ミルク/.test(ing)),
  },
  { key: 'デカ系の魚', collections: ['fishes'], test: (e) => e.name?.startsWith('大種') },
]

function buildDynamicCategoryMembers(collections) {
  const members = {}
  for (const rule of DYNAMIC_CATEGORY_RULES) {
    const matches = rule.collections.flatMap((name) =>
      (collections[name] ?? []).filter((e) => (rule.test ? rule.test(e) : true)),
    )
    members[rule.key] = matches.map((e) => [e.name, e.name_jp])
  }
  return members
}

export function buildItemIndex(collections, computeHref) {
  const byJp = new Map()
  const byZh = new Map()

  for (const collectionName of ITEM_INDEX_COLLECTIONS) {
    for (const entry of collections[collectionName] ?? []) {
      const href = computeHref(collectionName, entry)
      if (entry.name_jp && !byJp.has(entry.name_jp)) byJp.set(entry.name_jp, href)
      if (entry.name && !byZh.has(entry.name)) byZh.set(entry.name, href)

      // aliases：同物異寫/異譯登記（如 魔法紅草（マジックレッド）→ 魔術紅草），
      // 元素同為 `中文（日文）` 格式；主名優先，別名不覆蓋既有鍵
      for (const alias of entry.aliases ?? []) {
        const parsed = parseItemString(alias)
        if (!parsed) continue
        if (parsed.jp && !byJp.has(parsed.jp)) byJp.set(parsed.jp, href)
        if (parsed.zh && !byZh.has(parsed.zh)) byZh.set(parsed.zh, href)
      }
    }
  }

  const categoryMembers = { ...GAME_SPECIES_CATEGORIES, ...buildDynamicCategoryMembers(collections) }

  return { byJp, byZh, categoryMembers }
}

function resolveCategoryMembers(members, categoryJp, warnings, sourceLabel, index) {
  return members.map(([zh, jp]) => {
    const href = index.byZh.get(zh) ?? index.byJp.get(jp) ?? null
    if (!href) warnings.push(`類別食材「${categoryJp}」成員「${zh}」查無條目（來源：${sourceLabel}）`)
    return { zh, jp, href }
  })
}

// 類別型物品參照（如「蘑菇類（きのこ類）」「所有農作物（農作物全部）」「大種系魚類（デカ系の魚）」）
// → 展開為站內同類物品清單，供條目頁點擊瀏覽；未收錄的類別回傳 null，交由下方一般物品解析
// 走「查無」流程（不臆測未收錄類別）。先試 T6.12 既有窄規則（僅認「XX類（YY類」型，recipes
// 食材欄用），沒中再試 U21 新增的寬規則（characters 禮物欄字尾更雜：系/全部/全般，見
// ingredientCategories.js `parseCategoryReference` 說明）。
function resolveCategory(raw, index, warnings, sourceLabel) {
  const narrow = parseCategoryIngredient(raw)
  if (narrow) {
    return { ...narrow, members: resolveCategoryMembers(narrow.members, narrow.categoryJp, warnings, sourceLabel, index) }
  }

  const broad = parseCategoryReference(raw)
  if (!broad) return null
  const members = index.categoryMembers[broad.jpKey] ?? index.categoryMembers[broad.jpRawKey]
  if (!members) return null

  return {
    text: broad.text,
    category: broad.category,
    categoryJp: broad.categoryJp,
    members: resolveCategoryMembers(members, broad.categoryJp, warnings, sourceLabel, index),
  }
}

function resolveOne(raw, index, warnings, sourceLabel) {
  const category = resolveCategory(raw, index, warnings, sourceLabel)
  if (category) return category

  const parsed = parseItemString(raw)
  if (!parsed) return { text: raw, href: null }

  const href = (parsed.jp && index.byJp.get(parsed.jp)) ?? index.byZh.get(parsed.zh) ?? null
  if (!href) {
    warnings.push(`物品索引查無「${raw}」（來源：${sourceLabel}）`)
  }
  return { zh: parsed.zh, jp: parsed.jp, href }
}

// 以 name_jp 為主鍵、中文名為輔鍵查找；中文譯名跨來源不穩定，日文優先命中。
// 「A 或 B」擇一項目拆開個別解析，保留擇一結構（alternatives）給前端呈現。
export function resolveItemStrings(items, index, warnings, sourceLabel) {
  if (!items) return undefined

  return items.map((raw) => {
    const parts = raw.split('或').map((part) => part.trim()).filter(Boolean)
    if (parts.length > 1) {
      return { alternatives: parts.map((part) => resolveOne(part, index, warnings, sourceLabel)) }
    }
    return resolveOne(raw, index, warnings, sourceLabel)
  })
}
