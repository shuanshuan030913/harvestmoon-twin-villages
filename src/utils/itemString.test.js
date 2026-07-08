import { describe, expect, it } from 'vitest'
import { parseItemString, splitIngredientField } from './itemString.js'

describe('parseItemString', () => {
  it('parses 中文（日文）format with full-width parentheses', () => {
    expect(parseItemString('胡蘿蔔（にんじん）')).toEqual({ zh: '胡蘿蔔', jp: 'にんじん' })
  })

  it('falls back to zh-only for plain Chinese with no parentheses', () => {
    expect(parseItemString('地瓜')).toEqual({ zh: '地瓜', jp: null })
  })

  it('falls back to zh-only for a bare category ingredient string', () => {
    expect(parseItemString('きのこ類')).toEqual({ zh: 'きのこ類', jp: null })
  })
})

describe('splitIngredientField', () => {
  it('splits a ＋-separated ingredient field and each item parses correctly', () => {
    const items = splitIngredientField('米飯（ごはん）＋胡蘿蔔（にんじん）')
    expect(items).toEqual(['米飯（ごはん）', '胡蘿蔔（にんじん）'])
    expect(items.map(parseItemString)).toEqual([
      { zh: '米飯', jp: 'ごはん' },
      { zh: '胡蘿蔔', jp: 'にんじん' },
    ])
  })

  it('returns a single-item array when there is no ＋ separator', () => {
    expect(splitIngredientField('地瓜')).toEqual(['地瓜'])
  })
})
