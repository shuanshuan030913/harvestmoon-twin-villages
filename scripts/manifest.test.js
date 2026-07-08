import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildManifest, categorizeWarning, computeContentHash, summarizeWarnings } from './manifest.js'

describe('categorizeWarning', () => {
  it('categorizes each known warning shape', () => {
    expect(categorizeWarning('wikilink 查無目標「x」（來源：y）')).toBe('wikilink 查無目標')
    expect(categorizeWarning('wikilink 對照表撞名：「x」指向 2 個條目，該鍵作廢')).toBe(
      'wikilink 對照表撞名',
    )
    expect(categorizeWarning('物品索引查無「x」（來源：y）')).toBe('物品索引查無')
    expect(categorizeWarning('crops/x：缺少必填欄位「name_jp」')).toBe('缺少必填欄位')
    expect(categorizeWarning('crops/x：grow_days 格式不合法「abc」')).toBe('grow_days 格式不合法')
    expect(categorizeWarning('animals/x：treat_requirements.茶點 結構不合法')).toBe(
      'treat_requirements 結構不合法',
    )
    expect(categorizeWarning('某種未知格式的警告')).toBe('其他')
  })
})

describe('summarizeWarnings', () => {
  it('groups and counts warnings by category', () => {
    const warnings = [
      'wikilink 查無目標「a」（來源：x）',
      'wikilink 查無目標「b」（來源：x）',
      '物品索引查無「c」（來源：x）',
    ]
    const summary = summarizeWarnings(warnings)
    expect(summary.get('wikilink 查無目標')).toBe(2)
    expect(summary.get('物品索引查無')).toBe(1)
  })
})

describe('buildManifest', () => {
  it('produces counts derived from collection lengths', () => {
    const manifest = buildManifest({
      collections: { crops: [{}, {}], characters: [{}] },
      warnings: ['w1'],
      contentHash: 'abc123',
      builtAt: '2026-07-08T00:00:00.000Z',
    })
    expect(manifest).toEqual({
      builtAt: '2026-07-08T00:00:00.000Z',
      contentHash: 'abc123',
      counts: { crops: 2, characters: 1 },
      warnings: ['w1'],
    })
  })
})

describe('computeContentHash', () => {
  it('is stable across repeated calls when content is unchanged', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hmtv-hash-'))
    fs.writeFileSync(path.join(dir, 'a.md'), 'hello')
    fs.mkdirSync(path.join(dir, 'sub'))
    fs.writeFileSync(path.join(dir, 'sub', 'b.md'), 'world')

    const first = computeContentHash(dir)
    const second = computeContentHash(dir)
    expect(first).toBe(second)

    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('changes when file content changes', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hmtv-hash-'))
    fs.writeFileSync(path.join(dir, 'a.md'), 'hello')
    const before = computeContentHash(dir)

    fs.writeFileSync(path.join(dir, 'a.md'), 'hello world')
    const after = computeContentHash(dir)

    expect(before).not.toBe(after)
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
