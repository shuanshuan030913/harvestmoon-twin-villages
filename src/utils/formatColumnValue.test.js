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
})
