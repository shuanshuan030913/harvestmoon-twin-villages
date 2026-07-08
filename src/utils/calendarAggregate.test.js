import { describe, expect, it, vi } from 'vitest'
import { buildCalendar } from './calendarAggregate.js'
import { SEASON_DAYS, SEASONS } from './gameCalendar.js'

describe('buildCalendar', () => {
  it('produces a 4-season × SEASON_DAYS grid', () => {
    const calendar = buildCalendar([], (e) => e.date)
    expect(Object.keys(calendar)).toEqual(SEASONS)
    for (const season of SEASONS) {
      expect(calendar[season]).toHaveLength(SEASON_DAYS)
    }
  })

  it('places an entry on the correct season/day (春-27 娜娜)', () => {
    const entries = [{ name: '娜娜', date: '春-27' }]
    const calendar = buildCalendar(entries, (e) => e.date)
    expect(calendar['春'][26]).toEqual([{ name: '娜娜', date: '春-27' }])
  })

  it('skips entries with an unparseable date and warns, without throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const entries = [
      { name: '娜娜', date: '春-27' },
      { name: '壞資料', date: '不知道' },
    ]
    expect(() => buildCalendar(entries, (e) => e.date)).not.toThrow()
    const calendar = buildCalendar(entries, (e) => e.date)
    const totalEntries = SEASONS.flatMap((season) => calendar[season]).flat()
    expect(totalEntries).toEqual([{ name: '娜娜', date: '春-27' }])
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
