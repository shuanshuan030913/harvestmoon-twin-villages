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
