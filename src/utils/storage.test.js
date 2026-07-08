import { describe, expect, it } from 'vitest'
import { loadSave, loadSaveWithMigration, saveSave, STORAGE_KEY } from './storage.js'

function createMockStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value
    },
    _data: data,
  }
}

describe('loadSave', () => {
  it('returns null with no error when nothing is stored yet', () => {
    const storage = createMockStorage()
    expect(loadSave(storage)).toEqual({ save: null, error: null })
  })

  it('parses valid stored JSON', () => {
    const save = { schemaVersion: 1 }
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(save) })
    expect(loadSave(storage)).toEqual({ save, error: null })
  })

  it('reports a parse-failed error for corrupted JSON without overwriting it', () => {
    const storage = createMockStorage({ [STORAGE_KEY]: '{ not valid json' })
    expect(loadSave(storage)).toEqual({ save: null, error: 'parse-failed' })
    // 讀取失敗不得覆蓋原始壞資料
    expect(storage._data[STORAGE_KEY]).toBe('{ not valid json')
  })
})

describe('saveSave', () => {
  it('writes the save and reports ok', () => {
    const storage = createMockStorage()
    const result = saveSave({ schemaVersion: 1 }, storage)
    expect(result).toEqual({ ok: true })
    expect(storage._data[STORAGE_KEY]).toBe(JSON.stringify({ schemaVersion: 1 }))
  })

  it('reports failure without throwing when storage.setItem throws (e.g. QuotaExceededError)', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      },
    }
    expect(() => saveSave({ schemaVersion: 1 }, storage)).not.toThrow()
    expect(saveSave({ schemaVersion: 1 }, storage)).toEqual({ ok: false })
  })
})

describe('loadSaveWithMigration', () => {
  it('upgrades a v0 fixture to v1 and writes the upgraded save back', () => {
    const v0 = {
      schemaVersion: 0,
      calendar: { year: 1, season: '春', day: 1 },
      plots: [],
      animals: [],
    }
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(v0) })

    const result = loadSaveWithMigration(storage)

    expect(result).toEqual({
      save: { ...v0, schemaVersion: 1, checklists: {} },
      error: null,
    })
    // 遷移後立即回寫
    expect(JSON.parse(storage._data[STORAGE_KEY])).toEqual(result.save)
  })

  it('passes through a save already at the current version without rewriting', () => {
    const v1 = { schemaVersion: 1, calendar: null, plots: [], animals: [], checklists: {} }
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(v1) })

    expect(loadSaveWithMigration(storage)).toEqual({ save: v1, error: null })
  })

  it('rejects a save newer than the current schema version', () => {
    const future = { schemaVersion: 999 }
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(future) })

    expect(loadSaveWithMigration(storage)).toEqual({
      save: null,
      error: 'schema-version-rejected',
    })
  })

  it('propagates a parse-failed error without attempting migration', () => {
    const storage = createMockStorage({ [STORAGE_KEY]: '{ not valid json' })
    expect(loadSaveWithMigration(storage)).toEqual({ save: null, error: 'parse-failed' })
  })
})
