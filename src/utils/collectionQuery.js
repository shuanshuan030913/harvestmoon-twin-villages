import { sortByGrowDaysMin } from './sort.js'

export function applyFilters(entries, filters) {
  return entries.filter((entry) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true
      const entryValue = entry[key]
      if (Array.isArray(entryValue)) return entryValue.includes(value)
      return String(entryValue) === value
    }),
  )
}

export function applySort(entries, sortKey) {
  if (!sortKey) return entries
  if (sortKey === 'grow_days') return sortByGrowDaysMin(entries)

  return [...entries].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    if (typeof av === 'number' && typeof bv === 'number') return av - bv
    return String(av ?? '').localeCompare(String(bv ?? ''))
  })
}
