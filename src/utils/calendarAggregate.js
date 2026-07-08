import { parseSeasonDay, SEASON_DAYS, SEASONS } from './gameCalendar.js'

export function buildCalendar(entries, getDate = (entry) => entry.date) {
  const calendar = {}
  for (const season of SEASONS) {
    calendar[season] = Array.from({ length: SEASON_DAYS }, () => [])
  }

  for (const entry of entries) {
    const dateString = getDate(entry)
    const parsed = parseSeasonDay(dateString)
    if (!parsed) {
      console.warn(`buildCalendar: 無法解析日期「${dateString}」`, entry)
      continue
    }
    calendar[parsed.season][parsed.day - 1].push(entry)
  }

  return calendar
}
