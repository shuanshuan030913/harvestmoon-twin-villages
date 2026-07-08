export function buildHaystack(entry, fields) {
  return fields
    .map((field) => entry[field])
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function matchesQuery(haystack, query) {
  const keywords = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return true
  return keywords.every((keyword) => haystack.includes(keyword))
}

export function searchEntries(entries, query, fields) {
  return entries.filter((entry) => matchesQuery(buildHaystack(entry, fields), query))
}
