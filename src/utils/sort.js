import { parseGrowDays } from './growDays.js'

export function sortByGrowDaysMin(entries) {
  return [...entries].sort((a, b) => {
    const aMin = parseGrowDays(a.grow_days)?.min
    const bMin = parseGrowDays(b.grow_days)?.min

    if (aMin === undefined && bMin === undefined) return 0
    if (aMin === undefined) return 1
    if (bMin === undefined) return -1
    return aMin - bMin
  })
}
