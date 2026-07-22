import { describe, expect, it } from 'vitest'
import { applyFilters, sortEntries } from './collectionQuery.js'

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

describe('sortEntries', () => {
  it('returns entries unchanged when sortConfig is absent (U50 items 本輪跳過)', () => {
    const entries = [{ slug: 'b' }, { slug: 'a' }]
    expect(sortEntries(entries, undefined)).toEqual(entries)
  })

  it('groups animals by species so 牛/茶牛 and 羊/黑羊 end up adjacent', () => {
    const entries = [
      { slug: '牛', species: '牛', buy_price: '1500 / 3000（小牛／成牛）' },
      { slug: '羊', species: '羊', buy_price: '3000 / 7000（小羊／成羊）' },
      { slug: '羊駝', species: '羊駝', buy_price: '18000（白色／茶色羊駝同價）' },
      { slug: '茶牛', species: '牛', buy_price: '5500 / 13500（小茶牛／成牛）' },
      { slug: '黑羊', species: '羊', buy_price: '4500 / 10000（小黑羊／成羊）' },
    ]
    const groupOrder = ['牛', '羊', '羊駝']
    const result = sortEntries(entries, { groupBy: 'species', groupOrder, secondaryBy: 'buy_price_leading' })
    expect(result.map((e) => e.slug)).toEqual(['牛', '茶牛', '羊', '黑羊', '羊駝'])
  })

  it('groups crops by season (multi-season entries use their earliest season) then grow_days_min ascending', () => {
    const entries = [
      { slug: '南瓜', season: ['夏'], grow_days: '20' },
      { slug: '包心菜', season: ['春'], grow_days: '10-14' },
      { slug: '卡薩布蘭卡', season: ['春'], grow_days: '5' },
      { slug: '跨季作物', season: ['夏', '春'], grow_days: '1' },
    ]
    const result = sortEntries(entries, {
      groupBy: 'season',
      groupOrder: ['春', '夏', '秋', '冬'],
      secondaryBy: 'grow_days_min',
    })
    expect(result.map((e) => e.slug)).toEqual(['跨季作物', '卡薩布蘭卡', '包心菜', '南瓜'])
  })

  it('groups characters by village then sorts birthday ascending within each village', () => {
    const entries = [
      { slug: '藍鈴村-晚生日', village: '藍鈴村', birthday: '夏-20' },
      { slug: '此花村-角色', village: '此花村', birthday: '春-3' },
      { slug: '藍鈴村-早生日', village: '藍鈴村', birthday: '春-5' },
      { slug: '雙村共通-角色', village: '雙村共通', birthday: '冬-1' },
    ]
    const result = sortEntries(entries, {
      groupBy: 'village',
      groupOrder: ['藍鈴村', '此花村', '雙村共通'],
      secondaryBy: 'birthday_calendar',
    })
    expect(result.map((e) => e.slug)).toEqual([
      '藍鈴村-早生日',
      '藍鈴村-晚生日',
      '此花村-角色',
      '雙村共通-角色',
    ])
  })

  it('sorts festivals by day ascending with null/undefined day first', () => {
    const entries = [
      { slug: '賞花日', day: 9 },
      { slug: '料理大會', day: undefined },
      { slug: '兒童節', day: 15 },
    ]
    const result = sortEntries(entries, { secondaryBy: 'day_asc_null_first' })
    expect(result.map((e) => e.slug)).toEqual(['料理大會', '賞花日', '兒童節'])
  })

  it('falls back entries without a numeric secondary value to the end', () => {
    const entries = [
      { slug: '無賣價', sell_price: null },
      { slug: '便宜', sell_price: 500 },
      { slug: '昂貴', sell_price: 15000 },
    ]
    const result = sortEntries(entries, { secondaryBy: 'sell_price' })
    expect(result.map((e) => e.slug)).toEqual(['便宜', '昂貴', '無賣價'])
  })
})
