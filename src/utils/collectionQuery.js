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
