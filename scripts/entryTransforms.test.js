import { describe, expect, it } from 'vitest'
import { extractPortrait, stripEditorialNotes } from './entryTransforms.js'

describe('stripEditorialNotes', () => {
  it('removes editorial blockquotes (命名說明/資料修正/關於…) including continuation lines', () => {
    const markdown = [
      '內文第一段。',
      '',
      '> **命名說明**：來源寫「杏仁酒」，',
      '> 但日文名あんず＝杏子。',
      '',
      '> **資料修正（2026-07-12）**：原判斷錯誤。',
      '',
      '## 相關',
    ].join('\n')
    const result = stripEditorialNotes(markdown)
    expect(result).not.toContain('命名說明')
    expect(result).not.toContain('資料修正')
    expect(result).toContain('內文第一段。')
    expect(result).toContain('## 相關')
  })

  it('keeps gameplay-info blockquotes (e.g. > **注意**：賣價為 5★ 品質)', () => {
    const markdown = '> **注意**：以下所有售價均為 5★ 品質的賣價。\n\n內文。'
    expect(stripEditorialNotes(markdown)).toContain('注意')
  })
})

describe('extractPortrait', () => {
  it('returns the first image whose alt starts with the character name, path rewritten', () => {
    const markdown = [
      '![娜娜（ナナ）](../images/leomoon173-pixnet-5012321571/aaa.jpg)',
      '![居住地點外觀](../images/leomoon173-pixnet-5012321571/bbb.jpg)',
    ].join('\n')
    expect(extractPortrait(markdown, '娜娜', '/base/')).toBe(
      '/base/images/leomoon173-pixnet-5012321571/aaa.jpg',
    )
  })

  it('ignores non-portrait images and returns undefined when none match', () => {
    const markdown = '![居住地點外觀](../images/x/bbb.jpg)'
    expect(extractPortrait(markdown, '娜娜', '/base/')).toBeUndefined()
  })
})
