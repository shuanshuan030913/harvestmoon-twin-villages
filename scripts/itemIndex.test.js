import { describe, expect, it } from 'vitest'
import { buildItemIndex, resolveItemStrings } from './itemIndex.js'

function computeHref(collectionName, entry) {
  return `#/c/${collectionName}/${entry.slug}`
}

describe('buildItemIndex + resolveItemStrings', () => {
  const collections = {
    crops: [{ slug: '卡薩布蘭卡', name: '卡薩布蘭卡', name_jp: 'カサブランカ' }],
    recipes: [],
    fishes: [],
    items: [],
    insects: [],
    minerals: [],
  }
  const index = buildItemIndex(collections, computeHref)

  it('resolves 「卡薩布蘭卡」 found in a character likes list to its crops entry', () => {
    const warnings = []
    const result = resolveItemStrings(['卡薩布蘭卡（カサブランカ）'], index, warnings, 'characters/x')
    expect(result).toEqual([{ zh: '卡薩布蘭卡', jp: 'カサブランカ', href: '#/c/crops/卡薩布蘭卡' }])
    expect(warnings).toEqual([])
  })

  it('warns when the item cannot be found (たき込みご飯 before recipes are entered)', () => {
    const warnings = []
    const result = resolveItemStrings(['炊飯（たき込みご飯）'], index, warnings, 'characters/娜娜')
    expect(result).toEqual([{ zh: '炊飯', jp: 'たき込みご飯', href: null }])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('たき込みご飯')
  })

  it('falls back to the Chinese name when there is no jp fragment', () => {
    const warnings = []
    const result = resolveItemStrings(['卡薩布蘭卡'], index, warnings, 'characters/x')
    expect(result).toEqual([{ zh: '卡薩布蘭卡', jp: null, href: '#/c/crops/卡薩布蘭卡' }])
  })

  it('splits 「A 或 B」 alternatives and resolves each part separately', () => {
    const warnings = []
    const result = resolveItemStrings(
      ['卡薩布蘭卡（カサブランカ）或炊飯（たき込みご飯）'],
      index,
      warnings,
      'recipes/x',
    )
    expect(result).toEqual([
      {
        alternatives: [
          { zh: '卡薩布蘭卡', jp: 'カサブランカ', href: '#/c/crops/卡薩布蘭卡' },
          { zh: '炊飯', jp: 'たき込みご飯', href: null },
        ],
      },
    ])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('たき込みご飯')
  })

  it('returns undefined when the field itself is absent', () => {
    expect(resolveItemStrings(undefined, index, [], 'x')).toBeUndefined()
  })

  it('resolves alias spellings (魔法紅草（マジックレッド）→ 魔術紅草 entry) via aliases field', () => {
    const withAlias = buildItemIndex(
      {
        ...collections,
        items: [
          {
            slug: '魔術紅草',
            name: '魔術紅草',
            name_jp: 'マジックレッド草',
            aliases: ['魔法紅草（マジックレッド）'],
          },
        ],
      },
      computeHref,
    )
    const warnings = []
    const result = resolveItemStrings(['魔法紅草（マジックレッド）'], withAlias, warnings, 'characters/x')
    expect(result).toEqual([{ zh: '魔法紅草', jp: 'マジックレッド', href: '#/c/items/魔術紅草' }])
    expect(warnings).toEqual([])
  })

  it('expands a recognized category ingredient into its resolved member list (T6.12)', () => {
    const withMushrooms = buildItemIndex(
      {
        ...collections,
        items: [{ slug: '香菇', name: '香菇', name_jp: 'シイタケ' }],
      },
      computeHref,
    )
    const warnings = []
    const result = resolveItemStrings(['蘑菇類（きのこ類）'], withMushrooms, warnings, 'recipes/烤蘑菇')
    expect(result[0].text).toBe('蘑菇類（きのこ類）')
    expect(result[0].category).toBe('蘑菇')
    expect(result[0].categoryJp).toBe('きのこ')
    expect(result[0].members).toEqual(
      expect.arrayContaining([{ zh: '香菇', jp: 'シイタケ', href: '#/c/items/香菇' }]),
    )
    // 只有「香菇」在索引中，其餘 きのこ 類成員在這個 fixture 裡查無、各記一則警告
    expect(warnings).toHaveLength(result[0].members.length - 1)
  })

  it('warns per-member when a category member is missing from the index instead of silently dropping it', () => {
    const warnings = []
    // 全空 collections：きのこ 類的每個成員都查無條目
    const result = resolveItemStrings(['蘑菇類（きのこ類）'], index, warnings, 'recipes/烤蘑菇')
    expect(result[0].members.every((m) => m.href === null)).toBe(true)
    expect(warnings.length).toBe(result[0].members.length)
    expect(warnings[0]).toContain('類別食材「きのこ」成員')
  })

  it('falls back to the ordinary 查無 warning for an unrecognized category (フルーツ類)', () => {
    const warnings = []
    const result = resolveItemStrings(['水果類（フルーツ類）'], index, warnings, 'recipes/x')
    expect(result[0].members).toBeUndefined()
  })

  it('alias keys never shadow another entry primary name', () => {
    const clashing = buildItemIndex(
      {
        ...collections,
        items: [{ slug: '真品', name: '真品', name_jp: 'ホンモノ' }],
        minerals: [{ slug: '他物', name: '他物', name_jp: 'タブツ', aliases: ['真品（ホンモノ）'] }],
      },
      computeHref,
    )
    expect(clashing.byJp.get('ホンモノ')).toBe('#/c/items/真品')
    expect(clashing.byZh.get('真品')).toBe('#/c/items/真品')
  })
})
