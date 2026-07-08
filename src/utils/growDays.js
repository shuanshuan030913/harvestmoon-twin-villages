export function parseGrowDays(str) {
  if (typeof str !== 'string') return null

  const rangeMatch = str.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    const min = Number(rangeMatch[1])
    const max = Number(rangeMatch[2])
    if (min > max) return null
    return { min, max }
  }

  const singleMatch = str.match(/^(\d+)$/)
  if (singleMatch) {
    const value = Number(singleMatch[1])
    return { min: value, max: value }
  }

  return null
}
