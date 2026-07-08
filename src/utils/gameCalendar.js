export const SEASONS = ['春', '夏', '秋', '冬']
export const SEASON_DAYS = 31

export function createGameDate(year, season, day) {
  if (!Number.isInteger(year) || year < 1) return null
  if (!SEASONS.includes(season)) return null
  if (!Number.isInteger(day) || day < 1 || day > SEASON_DAYS) return null
  return { year, season, day }
}

export function advanceDay({ year, season, day }) {
  if (day < SEASON_DAYS) {
    return { year, season, day: day + 1 }
  }

  const seasonIndex = SEASONS.indexOf(season)
  if (seasonIndex === SEASONS.length - 1) {
    return { year: year + 1, season: SEASONS[0], day: 1 }
  }
  return { year, season: SEASONS[seasonIndex + 1], day: 1 }
}

export function parseSeasonDay(str) {
  if (typeof str !== 'string') return null
  const match = str.match(/^(.+)-(\d+)$/)
  if (!match) return null

  const [, season, dayStr] = match
  if (!SEASONS.includes(season)) return null

  const day = Number(dayStr)
  if (!Number.isInteger(day) || day < 1 || day > SEASON_DAYS) return null

  return { season, day }
}

function ordinal({ year, season, day }) {
  const seasonIndex = SEASONS.indexOf(season)
  return (year - 1) * SEASONS.length * SEASON_DAYS + seasonIndex * SEASON_DAYS + (day - 1)
}

export function diffDays(a, b) {
  return ordinal(b) - ordinal(a)
}

export function isSameDate(a, b) {
  if (!a || !b) return false
  return a.year === b.year && a.season === b.season && a.day === b.day
}
