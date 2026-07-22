import { describe, expect, it } from 'vitest'
import { addCollectionAliases, buildWikilinkTable, resolveWikilinks } from './wikilinks.js'

describe('buildWikilinkTable', () => {
  it('indexes entries by name/title/slug', () => {
    const entries = [{ slug: 'nana', name: '娜娜', title: '娜娜', href: '#/c/characters/nana' }]
    const { table, warnings } = buildWikilinkTable(entries)
    expect(table.get('娜娜')).toBe(entries[0])
    expect(table.get('nana')).toBe(entries[0])
    expect(warnings).toEqual([])
  })

  it('invalidates a key shared by two different entries and warns', () => {
    const a = { slug: 'a', name: '衝突', href: '#/c/x/a' }
    const b = { slug: 'b', name: '衝突', href: '#/c/x/b' }
    const { table, warnings } = buildWikilinkTable([a, b])
    expect(table.has('衝突')).toBe(false)
    expect(table.get('a')).toBe(a)
    expect(table.get('b')).toBe(b)
    expect(warnings).toHaveLength(1)
  })
})

describe('addCollectionAliases', () => {
  it('registers a collection list-page target for a plain alias key', () => {
    const table = new Map()
    addCollectionAliases(table, { 作物: '#/c/crops' })
    expect(table.get('作物')).toEqual({ href: '#/c/crops' })
  })

  it('does not overwrite an existing entry key with the same alias', () => {
    const entry = { slug: '作物', name: '作物', href: '#/c/guides/作物' }
    const table = new Map([['作物', entry]])
    addCollectionAliases(table, { 作物: '#/c/crops' })
    expect(table.get('作物')).toBe(entry)
  })
})

describe('resolveWikilinks', () => {
  it('converts a resolvable wikilink to an anchor tag', () => {
    const table = new Map([['藍鈴村商店指南', { href: '#/guide/basics/藍鈴村商店指南' }]])
    const warnings = []
    const html = '請參考 [[藍鈴村商店指南]]。'
    expect(resolveWikilinks(html, table, warnings, 'test')).toBe(
      '請參考 <a href="#/guide/basics/藍鈴村商店指南">藍鈴村商店指南</a>。',
    )
    expect(warnings).toEqual([])
  })

  it('supports the [[target|alias]] display-text format', () => {
    const table = new Map([['娜娜', { href: '#/c/characters/此花村-娜娜' }]])
    const warnings = []
    expect(resolveWikilinks('[[娜娜|她]]', table, warnings, 'test')).toBe(
      '<a href="#/c/characters/此花村-娜娜">她</a>',
    )
  })

  it('falls back to plain text and warns when the target is not found', () => {
    const warnings = []
    expect(resolveWikilinks('[[查無此物]]', new Map(), warnings, 'test-source')).toBe('查無此物')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('查無此物')
    expect(warnings[0]).toContain('test-source')
  })
})
