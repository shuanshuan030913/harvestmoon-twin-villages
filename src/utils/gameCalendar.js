export const SEASONS = ['春', '夏', '秋', '冬']
export const SEASON_DAYS = 31

export function createGameDate(year, season, day) {
  if (!Number.isInteger(year) || year < 1) return null
  if (!SEASONS.includes(season)) return null
  if (!Number.isInteger(day) || day < 1 || day > SEASON_DAYS) return null
  return { year, season, day }
}
