import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildExportPayload, exportSave, importSave, restoreBackup } from '../utils/exportImport.js'
import { loadSave, saveSave, STORAGE_KEY } from '../utils/storage.js'

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

describe('import/export orchestration round-trip', () => {
  let capturedBlobText

  beforeEach(() => {
    const anchor = { href: '', download: '', click: vi.fn() }
    vi.stubGlobal('document', { createElement: vi.fn(() => anchor) })
    vi.stubGlobal('URL', {
      createObjectURL: (blob) => {
        capturedBlobText = blob.parts[0]
        return 'blob:mock-url'
      },
      revokeObjectURL: vi.fn(),
    })
    vi.stubGlobal(
      'Blob',
      class {
        constructor(parts) {
          this.parts = parts
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exports the current save, re-imports it into a fresh storage, and matches', () => {
    const original = {
      schemaVersion: 1,
      calendar: { year: 1, season: '春', day: 27 },
      plots: [{ id: 'p1', cropSlug: 'cassabranca', wateredDays: 3, lastWatered: null }],
      animals: [],
      checklists: { 'bell-jewels': ['紅色'] },
    }
    const sourceStorage = createMockStorage()
    saveSave(original, sourceStorage)

    // 匯出（讀 storage 目前存檔 + 觸發下載）
    const { save: current } = loadSave(sourceStorage)
    exportSave(current, new Date('2026-07-08T00:00:00.000Z'))
    const exportedFile = capturedBlobText

    // 匯入到一個全新（空）的裝置
    const targetStorage = createMockStorage()
    const importResult = importSave(exportedFile, targetStorage)

    expect(importResult).toEqual({ ok: true })
    expect(loadSave(targetStorage).save).toEqual(original)
  })

  it('a bad re-import can be undone via restoreBackup back to the pre-import state', () => {
    const before = {
      schemaVersion: 1,
      calendar: { year: 1, season: '春', day: 1 },
      plots: [],
      animals: [],
      checklists: {},
    }
    const storage = createMockStorage()
    saveSave(before, storage)

    const overwrite = buildExportPayload(
      { ...before, calendar: { year: 5, season: '冬', day: 31 } },
      new Date('2026-07-08T00:00:00.000Z'),
    )
    importSave(JSON.stringify(overwrite), storage)
    expect(loadSave(storage).save.calendar).toEqual({ year: 5, season: '冬', day: 31 })

    const restoreResult = restoreBackup(storage)

    expect(restoreResult).toEqual({ ok: true })
    expect(loadSave(storage).save).toEqual(before)
  })
})
