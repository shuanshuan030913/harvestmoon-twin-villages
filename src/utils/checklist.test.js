import { describe, expect, it } from 'vitest'
import {
  BELL_JEWEL_COLORS,
  buildBellJewelChecklist,
  buildCollectionChecklist,
  buildRomanceEventChecklist,
  ROMANCE_STAGES,
} from './checklist.js'

describe('buildCollectionChecklist', () => {
  it('maps a collection entry array to checklist items', () => {
    const entries = [
      { slug: 'fish-a', name: '魚 A' },
      { slug: 'fish-b', name: '魚 B' },
    ]
    expect(buildCollectionChecklist(entries)).toEqual([
      { id: 'fish-a', label: '魚 A' },
      { id: 'fish-b', label: '魚 B' },
    ])
  })

  it('produces an empty checklist for an empty collection without throwing', () => {
    expect(() => buildCollectionChecklist([])).not.toThrow()
    expect(buildCollectionChecklist([])).toEqual([])
  })

  it('produces an empty checklist when entries is missing without throwing', () => {
    expect(() => buildCollectionChecklist(undefined)).not.toThrow()
    expect(buildCollectionChecklist(undefined)).toEqual([])
  })
})

describe('buildBellJewelChecklist', () => {
  it('produces the 6 static bell jewel colors', () => {
    const checklist = buildBellJewelChecklist()
    expect(checklist).toHaveLength(6)
    expect(checklist.map((item) => item.id)).toEqual(BELL_JEWEL_COLORS)
  })
})

describe('buildRomanceEventChecklist', () => {
  it('generates a 角色 × 階段 skeleton for marriageable characters only', () => {
    const characters = [
      { slug: 'a-nana', name: '娜娜', marriageable: true },
      { slug: 'a-mob', name: '路人', marriageable: false },
    ]
    const checklist = buildRomanceEventChecklist(characters)
    expect(checklist).toHaveLength(ROMANCE_STAGES.length)
    expect(checklist[0]).toEqual({ id: 'a-nana-白花', label: '娜娜 · 白花' })
  })

  it('produces an empty checklist for an empty character array without throwing', () => {
    expect(() => buildRomanceEventChecklist([])).not.toThrow()
    expect(buildRomanceEventChecklist([])).toEqual([])
  })
})
