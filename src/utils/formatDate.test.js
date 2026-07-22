import { describe, expect, it } from 'vitest'
import { formatUpdatedAt } from './formatDate.js'

describe('formatUpdatedAt', () => {
  it('formats an ISO string as YYYY-MM-DD HH:MM', () => {
    const iso = new Date(2026, 6, 22, 22, 40).toISOString()
    expect(formatUpdatedAt(iso)).toBe('2026-07-22 22:40')
  })

  it('returns a placeholder when there is no timestamp yet', () => {
    expect(formatUpdatedAt(null)).toBe('尚無編輯紀錄')
    expect(formatUpdatedAt(undefined)).toBe('尚無編輯紀錄')
  })
})
