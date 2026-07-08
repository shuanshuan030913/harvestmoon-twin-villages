import { describe, expect, it } from 'vitest'
import { searchAllCollections } from './siteSearch.js'

const collections = {
  characters: [
    {
      slug: '此花村-娜娜',
      name: '娜娜',
      name_jp: 'ナナ',
      loves: ['炊飯（たき込みご飯）'],
      likes: [],
    },
    { slug: '藍鈴村-羅萬', name: '羅萬', name_jp: 'ロヴェン', loves: [], likes: [] },
  ],
  crops: [{ slug: '卡薩布蘭卡', name: '卡薩布蘭卡', name_jp: 'カサブランカ' }],
}

describe('searchAllCollections', () => {
  it('finds 娜娜 by her Japanese name (ナナ) under characters', () => {
    const results = searchAllCollections(collections, 'ナナ')
    expect(Object.keys(results)).toEqual(['characters'])
    expect(results.characters.map((e) => e.slug)).toEqual(['此花村-娜娜'])
  })

  it('finds 娜娜 via her loves field (たき込みご飯)', () => {
    const results = searchAllCollections(collections, 'たき込みご飯')
    expect(results.characters.map((e) => e.slug)).toEqual(['此花村-娜娜'])
  })

  it('groups results by collection when multiple collections match', () => {
    const results = searchAllCollections(collections, 'カサブランカ')
    expect(Object.keys(results)).toEqual(['crops'])
  })

  it('returns no groups when nothing matches', () => {
    expect(searchAllCollections(collections, '查無此物')).toEqual({})
  })
})
