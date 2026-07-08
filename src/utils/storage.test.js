import { describe, expect, it } from 'vitest'
import { loadSave, saveSave, STORAGE_KEY } from './storage.js'

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
