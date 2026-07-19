import { describe, expect, it } from 'vitest'
import { parseCategoryIngredient } from './ingredientCategories.js'

describe('parseCategoryIngredient', () => {
  it('parses a recognized category ingredient string into its member list', () => {
    const result = parseCategoryIngredient('蘑菇類（きのこ類）')
    expect(result.category).toBe('蘑菇')
    expect(result.categoryJp).toBe('きのこ')
    expect(result.text).toBe('蘑菇類（きのこ類）')
    expect(result.members).toEqual(expect.arrayContaining([['香菇', 'シイタケ']]))
  })

  it('keeps the exclusion note in the full text while still resolving the base category', () => {
    const result = parseCategoryIngredient('蘑菇類（きのこ類，松露除外）')
    expect(result.categoryJp).toBe('きのこ')
    expect(result.text).toBe('蘑菇類（きのこ類，松露除外）')
  })

  it('resolves 平假名／片假名 spelling variants of the same category to the same member list', () => {
    const hiragana = parseCategoryIngredient('蜂蜜類（はちみつ類）')
    const katakana = parseCategoryIngredient('蜂蜜類（ハチミツ類）')
    expect(hiragana.members).toEqual(katakana.members)
  })

  it('returns null for an unrecognized category (フルーツ類 has no verified member list)', () => {
    expect(parseCategoryIngredient('水果類（フルーツ類）')).toBeNull()
  })

  it('returns null for a plain non-category item string', () => {
    expect(parseCategoryIngredient('胡蘿蔔（にんじん）')).toBeNull()
  })
})
