import { describe, expect, it } from 'vitest'
import { advanceDay, createGameDate, SEASON_DAYS, SEASONS } from './gameCalendar.js'

describe('createGameDate', () => {
  it('creates a valid GameDate', () => {
    expect(createGameDate(1, '春', 1)).toEqual({ year: 1, season: '春', day: 1 })
    expect(createGameDate(3, '冬', SEASON_DAYS)).toEqual({
      year: 3,
      season: '冬',
      day: SEASON_DAYS,
    })
  })

  it('rejects day=0', () => {
    expect(createGameDate(1, '春', 0)).toBeNull()
  })

  it('rejects day beyond SEASON_DAYS', () => {
    expect(createGameDate(1, '春', SEASON_DAYS + 1)).toBeNull()
  })

  it('rejects an invalid season name', () => {
    expect(createGameDate(1, '梅雨', 1)).toBeNull()
  })

  it('rejects a non-integer year', () => {
    expect(createGameDate(0, '春', 1)).toBeNull()
    expect(createGameDate(1.5, '春', 1)).toBeNull()
  })

  it('does not clamp out-of-range values', () => {
    expect(createGameDate(1, '春', -1)).toBeNull()
    expect(createGameDate(1, '春', 100)).toBeNull()
  })
})

describe('SEASONS', () => {
  it('is ordered 春→夏→秋→冬', () => {
    expect(SEASONS).toEqual(['春', '夏', '秋', '冬'])
  })
})

describe('advanceDay', () => {
  it('advances by one day within a season', () => {
    expect(advanceDay({ year: 1, season: '春', day: 1 })).toEqual({
      year: 1,
      season: '春',
      day: 2,
    })
  })

  it('crosses into the next season', () => {
    expect(advanceDay({ year: 1, season: '春', day: SEASON_DAYS })).toEqual({
      year: 1,
      season: '夏',
      day: 1,
    })
  })

  it('crosses from winter into the next year', () => {
    expect(advanceDay({ year: 1, season: '冬', day: SEASON_DAYS })).toEqual({
      year: 2,
      season: '春',
      day: 1,
    })
  })

  it('does not mutate the input', () => {
    const input = { year: 1, season: '春', day: 1 }
    advanceDay(input)
    expect(input).toEqual({ year: 1, season: '春', day: 1 })
  })
})
