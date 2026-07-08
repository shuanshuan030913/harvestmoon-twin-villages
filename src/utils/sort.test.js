import { describe, expect, it } from 'vitest'
import { sortByGrowDaysMin } from './sort.js'

describe('sortByGrowDaysMin', () => {
  it('sorts ascending by the grow_days lower bound', () => {
    const entries = [
      { slug: 'b', grow_days: '10-14' },
      { slug: 'a', grow_days: '5' },
      { slug: 'c', grow_days: '20-25' },
    ]
    expect(sortByGrowDaysMin(entries).map((e) => e.slug)).toEqual(['a', 'b', 'c'])
  })

  it('sorts entries with missing/unparseable grow_days last, not as 0', () => {
    const entries = [
      { slug: 'missing', grow_days: undefined },
      { slug: 'low', grow_days: '1' },
      { slug: 'illegal', grow_days: 'abc' },
    ]
    expect(sortByGrowDaysMin(entries).map((e) => e.slug)).toEqual(['low', 'missing', 'illegal'])
  })

  it('does not mutate the input array', () => {
    const entries = [{ slug: 'b', grow_days: '10' }, { slug: 'a', grow_days: '5' }]
    const original = [...entries]
    sortByGrowDaysMin(entries)
    expect(entries).toEqual(original)
  })
})
