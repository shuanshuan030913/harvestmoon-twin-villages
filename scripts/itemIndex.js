import { parseItemString } from '../src/utils/itemString.js'
import { parseCategoryIngredient } from './ingredientCategories.js'

// 全站物品可能來源的 collection：喜好/食材字串解析時查找的範圍。
export const ITEM_INDEX_COLLECTIONS = ['crops', 'recipes', 'fishes', 'items', 'insects', 'minerals']

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

  return { byJp, byZh }
}

// 類別食材（如「蘑菇類（きのこ類）」）→ 展開為站內同類物品清單，供條目頁點擊瀏覽；
// 未收錄的類別（如「水果類」）回傳 null，交由下方一般物品解析走「查無」流程。
function resolveCategory(raw, index, warnings, sourceLabel) {
  const category = parseCategoryIngredient(raw)
  if (!category) return null

  return {
    ...category,
    members: category.members.map(([zh, jp]) => {
      const href = index.byZh.get(zh) ?? index.byJp.get(jp) ?? null
      if (!href) warnings.push(`類別食材「${category.categoryJp}」成員「${zh}」查無條目（來源：${sourceLabel}）`)
      return { zh, jp, href }
    }),
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
