import { describe, expect, it } from 'vitest'
import { buildHaystack, matchesQuery, searchEntries } from './search.js'

const fields = ['name', 'name_jp', 'loves']

describe('buildHaystack', () => {
  it('joins the given fields and lowercases the result', () => {
    const entry = { name: '娜娜', name_jp: 'ナナ', loves: 'Apple' }
    expect(buildHaystack(entry, fields)).toBe('娜娜 ナナ apple')
  })

  it('skips missing fields', () => {
    const entry = { name: '娜娜' }
    expect(buildHaystack(entry, fields)).toBe('娜娜')
  })
})

describe('matchesQuery', () => {
  it('matches with case-insensitive normalization', () => {
    expect(matchesQuery('娜娜 ナナ apple', 'APPLE')).toBe(true)
  })

  it('requires all keywords to match (AND)', () => {
    expect(matchesQuery('娜娜 ナナ apple', '娜娜 香蕉')).toBe(false)
    expect(matchesQuery('娜娜 ナナ apple', '娜娜 apple')).toBe(true)
  })
})

describe('searchEntries', () => {
  const entries = [
    { slug: 'a', name: '娜娜', name_jp: 'ナナ', loves: '炊飯' },
    { slug: 'b', name: '路人', name_jp: 'モブ', loves: '蘋果' },
  ]

  it('finds an entry by its Japanese name (ナナ)', () => {
    const results = searchEntries(entries, 'ナナ', fields)
    expect(results.map((e) => e.slug)).toEqual(['a'])
  })

  it('returns all entries for an empty query', () => {
    expect(searchEntries(entries, '', fields)).toHaveLength(2)
  })
})
