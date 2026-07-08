import { describe, expect, it } from 'vitest'
import {
  findDuplicateSlugs,
  validateGrowDays,
  validateRequiredFields,
  validateTreatRequirements,
} from './validate.js'

describe('validateRequiredFields', () => {
  it('warns for each missing required field', () => {
    const entry = { name: '壞資料' } // 缺 name_jp、village、buy_price...
    const warnings = validateRequiredFields('crops', entry, 'crops/壞資料')
    expect(warnings).toContain('crops/壞資料：缺少必填欄位「name_jp」')
    expect(warnings).toContain('crops/壞資料：缺少必填欄位「grow_days」')
  })

  it('does not warn when all required fields are present', () => {
    const entry = {
      name: '卡薩布蘭卡',
      name_jp: 'カサブランカ',
      season: ['春'],
      village: '藍鈴村',
      buy_price: 280,
      sell_price: 2320,
      grow_days: '10-14',
      regrowable: false,
    }
    expect(validateRequiredFields('crops', entry, 'crops/卡薩布蘭卡')).toEqual([])
  })
})

describe('validateGrowDays', () => {
  it('warns for an illegal grow_days format', () => {
    expect(validateGrowDays({ grow_days: '十天' }, 'crops/壞資料')).toEqual([
      'crops/壞資料：grow_days 格式不合法「十天」',
    ])
  })

  it('does not warn when grow_days is absent or valid', () => {
    expect(validateGrowDays({}, 'crops/x')).toEqual([])
    expect(validateGrowDays({ grow_days: '10-14' }, 'crops/x')).toEqual([])
  })
})

describe('validateTreatRequirements', () => {
  it('accepts a well-formed structure, including null categories', () => {
    const entry = {
      treat_requirements: {
        茶點: null,
        野菜: [12, 24, 36, 48],
        穀物: [12, 24, 36, 48],
        魚味: [5, 10, 15, 20],
      },
    }
    expect(validateTreatRequirements(entry, 'animals/羊駝')).toEqual([])
  })

  it('warns when an array is not length 4', () => {
    const entry = { treat_requirements: { 茶點: [2, 4, 6] } }
    expect(validateTreatRequirements(entry, 'animals/壞資料')).toEqual([
      'animals/壞資料：treat_requirements.茶點 結構不合法',
    ])
  })

  it('warns when an array contains a non-number, non-null value', () => {
    const entry = { treat_requirements: { 茶點: [2, 4, 6, '8'] } }
    expect(validateTreatRequirements(entry, 'animals/壞資料')).toEqual([
      'animals/壞資料：treat_requirements.茶點 結構不合法',
    ])
  })

  it('does not warn when the field is absent', () => {
    expect(validateTreatRequirements({}, 'animals/x')).toEqual([])
  })
})

describe('findDuplicateSlugs', () => {
  it('finds slugs shared by more than one entry', () => {
    const entries = [{ slug: 'a' }, { slug: 'b' }, { slug: 'a' }]
    expect(findDuplicateSlugs(entries)).toEqual(['a'])
  })

  it('returns an empty array when all slugs are unique', () => {
    expect(findDuplicateSlugs([{ slug: 'a' }, { slug: 'b' }])).toEqual([])
  })
})
