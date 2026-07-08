export function parseItemString(str) {
  if (typeof str !== 'string' || str.length === 0) return null

  const match = str.match(/^(.+)（(.+)）$/)
  if (match) {
    return { zh: match[1], jp: match[2] }
  }

  return { zh: str, jp: null }
}

export function splitIngredientField(str) {
  if (typeof str !== 'string') return []
  return str
    .split('＋')
    .map((item) => item.trim())
    .filter(Boolean)
}
