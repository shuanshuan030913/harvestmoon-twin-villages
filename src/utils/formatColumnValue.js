export function formatColumnValue(value) {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.join('、')
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}
