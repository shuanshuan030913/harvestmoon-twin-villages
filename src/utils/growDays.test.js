import { describe, expect, it } from 'vitest'
import { parseGrowDays } from './growDays.js'

describe('parseGrowDays', () => {
  it('parses a range string', () => {
    expect(parseGrowDays('10-14')).toEqual({ min: 10, max: 14 })
  })

  it('parses a single-number string', () => {
    expect(parseGrowDays('10')).toEqual({ min: 10, max: 10 })
  })

  it('rejects illegal formats', () => {
    expect(parseGrowDays('abc')).toBeNull()
    expect(parseGrowDays('10-')).toBeNull()
    expect(parseGrowDays('14-10')).toBeNull()
    expect(parseGrowDays('')).toBeNull()
    expect(parseGrowDays(null)).toBeNull()
  })
})
