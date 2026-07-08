import { parseItemString } from '../src/utils/itemString.js'

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
    }
  }

  return { byJp, byZh }
}

// 以 name_jp 為主鍵、中文名為輔鍵查找；中文譯名跨來源不穩定，日文優先命中。
export function resolveItemStrings(items, index, warnings, sourceLabel) {
  if (!items) return undefined

  return items.map((raw) => {
    const parsed = parseItemString(raw)
    if (!parsed) return { text: raw, href: null }

    const href = (parsed.jp && index.byJp.get(parsed.jp)) ?? index.byZh.get(parsed.zh) ?? null
    if (!href) {
      warnings.push(`物品索引查無「${raw}」（來源：${sourceLabel}）`)
    }
    return { zh: parsed.zh, jp: parsed.jp, href }
  })
}
