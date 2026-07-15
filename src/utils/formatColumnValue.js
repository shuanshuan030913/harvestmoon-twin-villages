export function formatColumnValue(value, column) {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.join('、')
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (column?.unit === 'G') return formatMoney(value)
  return String(value)
}

// 金額欄加「G」後綴（2026-07-15 使用者偏好）。資料值有三種形態：
// 純數字（590）、無單位字串（"140～330（依星級…）"、"800 / 1500（小雞／成雞）"）、
// 已含 G 的字串（"池1960G／瀑布下游720G"）——已含 G 的不重複加。
function formatMoney(value) {
  if (typeof value === 'number') return `${value} G`
  const str = String(value)
  if (str.includes('G')) return str
  // 開頭的數字段（含 ～ / 、空白、逗號）後插入 G；其後的（說明）保留
  const match = str.match(/^([\d,.\s～\-/／]*\d)(.*)$/)
  if (match) return `${match[1]} G${match[2]}`
  return str
}
