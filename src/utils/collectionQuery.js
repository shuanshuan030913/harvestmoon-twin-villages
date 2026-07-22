import { parseGrowDays } from './growDays.js'

// URL 以逗號存複選值：?season=春,夏&village=藍鈴村
export function parseMultiParam(raw) {
  return (raw ?? '').split(',').filter(Boolean)
}

// 複選語意（2026-07-14 使用者裁決，參照 jackjeanne-merch）：
// 同一群組內多值為 OR、跨群組為 AND。value 可為單一字串或字串陣列。
export function applyFilters(entries, filters) {
  return entries.filter((entry) =>
    Object.entries(filters).every(([key, value]) => {
      const selected = (Array.isArray(value) ? value : [value]).filter(Boolean)
      if (selected.length === 0) return true
      const entryValue = entry[key]
      return selected.some((candidate) =>
        Array.isArray(entryValue) ? entryValue.includes(candidate) : String(entryValue) === candidate,
      )
    }),
  )
}

// 排序邏輯（U42-U49/U51，2026-07-22，.spec/todo.md〈列表排序邏輯〉）：build-content.js
// 只依檔名 Unicode 序輸出，不是遊戲邏輯，這裡才是真正決定列表頁顯示順序的地方。
// 次排序值缺值一律排最後（Infinity），festivals 的 day 缺值例外排最前（-Infinity，
// 代表「常態/整季有效」優先看到，使用者裁決見 U43）。
const VALUE_EXTRACTORS = {
  grow_days_min: (entry) => parseGrowDays(entry.grow_days)?.min ?? Infinity,
  sell_price: (entry) => (typeof entry.sell_price === 'number' ? entry.sell_price : Infinity),
  sell_price_5star: (entry) => (typeof entry.sell_price_5star === 'number' ? entry.sell_price_5star : Infinity),
  day_asc_null_first: (entry) => entry.day ?? -Infinity,
  // animals/pets 的 buy_price 常是帶條件說明的複合字串
  // （如「1500 / 3000（小牛／成牛，成牛為此花村限定販售）」），取第一個數字
  // （通常是幼體/基礎品種價格）當排序權重。
  buy_price_leading: (entry) => {
    const match = String(entry.buy_price ?? '').match(/\d+/)
    return match ? Number(match[0]) : Infinity
  },
}

// 分組欄位可能是單值（village）或陣列（season 常見一物件跨多季），陣列取「最早
// 出現的分組」當權重，讓跨季條目落在它最早適用的那組（如春夏皆可種的作物排進春組）。
function groupWeight(order, rawValue) {
  const values = Array.isArray(rawValue) ? rawValue : [rawValue]
  const indices = values.map((value) => {
    const index = order.indexOf(value)
    return index === -1 ? order.length : index
  })
  return indices.length ? Math.min(...indices) : order.length
}

// config 宣告式指定：groupBy/groupOrder 決定分組相鄰與組間順序，secondaryBy 指定
// VALUE_EXTRACTORS 其中一個 key 當組內（或無分組時的唯一）排序依據。皆為可選，
// 沒有 sortConfig（如 items，U50 本輪跳過）時原樣回傳，不改動順序。
export function sortEntries(entries, sortConfig) {
  if (!sortConfig) return entries
  const { groupBy, groupOrder, secondaryBy } = sortConfig
  const secondaryExtractor = secondaryBy ? VALUE_EXTRACTORS[secondaryBy] : null
  return [...entries].sort((a, b) => {
    if (groupBy && groupOrder) {
      const diff = groupWeight(groupOrder, a[groupBy]) - groupWeight(groupOrder, b[groupBy])
      if (diff !== 0) return diff
    }
    if (secondaryExtractor) {
      const diff = secondaryExtractor(a) - secondaryExtractor(b)
      if (diff !== 0) return diff
    }
    return 0
  })
}
