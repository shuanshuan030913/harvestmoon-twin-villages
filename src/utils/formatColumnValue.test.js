import { describe, expect, it } from 'vitest'
import { formatColumnValue } from './formatColumnValue.js'

describe('formatColumnValue', () => {
  it('joins arrays with 、', () => {
    expect(formatColumnValue(['春', '夏'])).toBe('春、夏')
  })

  it('renders booleans as 是/否', () => {
    expect(formatColumnValue(true)).toBe('是')
    expect(formatColumnValue(false)).toBe('否')
  })

  it('renders missing values as —', () => {
    expect(formatColumnValue(null)).toBe('—')
    expect(formatColumnValue(undefined)).toBe('—')
  })

  it('stringifies other values as-is', () => {
    expect(formatColumnValue('春-27')).toBe('春-27')
    expect(formatColumnValue(2320)).toBe('2320')
  })

  it('appends G to money columns (unit: G)', () => {
    const col = { key: 'sell_price', unit: 'G' }
    expect(formatColumnValue(590, col)).toBe('590 G')
    expect(formatColumnValue('140～330（依星級 ☆1.0～5.0）', col)).toBe('140～330 G（依星級 ☆1.0～5.0）')
    expect(formatColumnValue('800 / 1500（小雞／成雞）', col)).toBe('800 / 1500 G（小雞／成雞）')
    expect(formatColumnValue('池1960G／瀑布下游720G', col)).toBe('池1960G／瀑布下游720G')
    expect(formatColumnValue('210G（☆2.5）／240G（☆3.0）', col)).toBe('210G（☆2.5）／240G（☆3.0）')
    expect(formatColumnValue('-', col)).toBe('-')
    expect(formatColumnValue(undefined, col)).toBe('—')
  })

  it('does not append G without unit', () => {
    expect(formatColumnValue(2320, { key: 'grow_days' })).toBe('2320')
  })
})
