import { describe, expect, it } from 'vitest'
import { applyFilters, applySort } from './collectionQuery.js'

describe('applyFilters', () => {
  const entries = [
    { slug: 'a', village: '此花村', marriageable: true },
    { slug: 'b', village: '藍鈴村', marriageable: false },
    { slug: 'c', village: '此花村', marriageable: false },
  ]

  it('filters by 此花村 + 可攻略 together', () => {
    const result = applyFilters(entries, { village: '此花村', marriageable: 'true' })
    expect(result.map((e) => e.slug)).toEqual(['a'])
  })

  it('ignores empty filter values', () => {
    expect(applyFilters(entries, { village: '', marriageable: '' })).toEqual(entries)
  })

  it('matches array-valued fields with includes', () => {
    const seasonalEntries = [
      { slug: 'x', season: ['春', '夏'] },
      { slug: 'y', season: ['秋'] },
    ]
    expect(applyFilters(seasonalEntries, { season: '春' }).map((e) => e.slug)).toEqual(['x'])
  })

  it('multi-select within a group is OR, across groups is AND', () => {
    const cropEntries = [
      { slug: '番茄', season: ['夏'], village: '藍鈴村' },
      { slug: '蕪菁', season: ['春'], village: '藍鈴村' },
      { slug: '白菜', season: ['秋'], village: '此花村' },
      { slug: '米', season: ['夏'], village: '此花村' },
    ]
    const result = applyFilters(cropEntries, { season: ['春', '夏'], village: ['藍鈴村'] })
    expect(result.map((e) => e.slug)).toEqual(['番茄', '蕪菁'])
  })
})

describe('applySort', () => {
  it('sorts numerically by sell_price ascending', () => {
    const entries = [
      { slug: 'a', sell_price: 300 },
      { slug: 'b', sell_price: 100 },
      { slug: 'c', sell_price: 200 },
    ]
    expect(applySort(entries, 'sell_price').map((e) => e.slug)).toEqual(['b', 'c', 'a'])
  })

  it('sorts by grow_days lower bound via sortByGrowDaysMin', () => {
    const entries = [
      { slug: 'a', grow_days: '10-14' },
      { slug: 'b', grow_days: '5' },
    ]
    expect(applySort(entries, 'grow_days').map((e) => e.slug)).toEqual(['b', 'a'])
  })

  it('returns entries unchanged when no sort key is given', () => {
    const entries = [{ slug: 'b' }, { slug: 'a' }]
    expect(applySort(entries, '')).toBe(entries)
  })
})
