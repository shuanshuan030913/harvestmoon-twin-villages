import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildExportFilename, buildExportPayload, exportSave, importSave } from './exportImport.js'
import { BACKUP_STORAGE_KEY, STORAGE_KEY } from './storage.js'

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

describe('buildExportPayload', () => {
  it('adds exportedAt as an ISO timestamp on top of the save', () => {
    const save = { schemaVersion: 1 }
    const now = new Date('2026-07-08T12:00:00.000Z')
    expect(buildExportPayload(save, now)).toEqual({
      schemaVersion: 1,
      exportedAt: '2026-07-08T12:00:00.000Z',
    })
  })
})

describe('buildExportFilename', () => {
  it('formats as hmtv-save-YYYYMMDD.json', () => {
    expect(buildExportFilename(new Date('2026-07-08T12:00:00.000Z'))).toBe(
      'hmtv-save-20260708.json',
    )
  })

  it('zero-pads single-digit month and day', () => {
    expect(buildExportFilename(new Date('2026-01-05T00:00:00.000Z'))).toBe(
      'hmtv-save-20260105.json',
    )
  })
})

describe('exportSave (browser download wiring, mocked DOM)', () => {
  let anchor
  let createElementSpy
  let createObjectURLSpy
  let revokeObjectURLSpy

  beforeEach(() => {
    anchor = { href: '', download: '', click: vi.fn() }
    createElementSpy = vi.fn(() => anchor)
    vi.stubGlobal('document', { createElement: createElementSpy })
    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: createObjectURLSpy, revokeObjectURL: revokeObjectURLSpy })
    vi.stubGlobal(
      'Blob',
      class {
        constructor(parts, options) {
          this.parts = parts
          this.options = options
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds a Blob with the export payload and triggers a download via an anchor click', () => {
    const save = { schemaVersion: 1, plots: [] }
    const now = new Date('2026-07-08T12:00:00.000Z')

    const payload = exportSave(save, now)

    expect(payload).toEqual({ schemaVersion: 1, plots: [], exportedAt: '2026-07-08T12:00:00.000Z' })
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(anchor.download).toBe('hmtv-save-20260708.json')
    expect(anchor.href).toBe('blob:mock-url')
    expect(anchor.click).toHaveBeenCalledOnce()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')

    const [blob] = createObjectURLSpy.mock.calls[0]
    expect(JSON.parse(blob.parts[0])).toEqual(payload)
  })
})

describe('importSave', () => {
  const validSave = {
    schemaVersion: 1,
    calendar: { year: 1, season: '春', day: 27 },
    plots: [],
    animals: [],
    checklists: {},
  }

  it('backs up the existing save then overwrites it with the imported one', () => {
    const existing = { ...validSave, calendar: { year: 1, season: '春', day: 1 } }
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(existing) })
    const imported = { ...validSave, exportedAt: '2026-07-08T00:00:00.000Z' }

    const result = importSave(JSON.stringify(imported), storage)

    expect(result).toEqual({ ok: true })
    expect(JSON.parse(storage._data[BACKUP_STORAGE_KEY])).toEqual(existing)
    // exportedAt 只是匯出檔的中繼資料，寫回現行存檔前應剝除
    expect(JSON.parse(storage._data[STORAGE_KEY])).toEqual(validSave)
  })

  it('does not touch the existing save when the import file is corrupted JSON', () => {
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(validSave) })
    const result = importSave('{ not valid json', storage)

    expect(result).toEqual({ ok: false, error: 'parse-failed' })
    expect(JSON.parse(storage._data[STORAGE_KEY])).toEqual(validSave)
    expect(storage._data[BACKUP_STORAGE_KEY]).toBeUndefined()
  })

  it('does not touch the existing save when schemaVersion is missing', () => {
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(validSave) })
    const bad = { ...validSave, schemaVersion: undefined }

    const result = importSave(JSON.stringify(bad), storage)

    expect(result).toEqual({ ok: false, error: 'invalid' })
    expect(JSON.parse(storage._data[STORAGE_KEY])).toEqual(validSave)
  })

  it('does not touch the existing save when calendar is not a legal GameDate', () => {
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(validSave) })
    const bad = { ...validSave, calendar: { year: 1, season: '春', day: 99 } }

    const result = importSave(JSON.stringify(bad), storage)

    expect(result).toEqual({ ok: false, error: 'invalid' })
    expect(JSON.parse(storage._data[STORAGE_KEY])).toEqual(validSave)
  })

  it('round-trips: export → clear → import produces the same save', () => {
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(validSave) })
    const exported = buildExportPayload(validSave, new Date('2026-07-08T00:00:00.000Z'))

    delete storage._data[STORAGE_KEY] // 模擬清空存檔
    const result = importSave(JSON.stringify(exported), storage)

    expect(result).toEqual({ ok: true })
    expect(JSON.parse(storage._data[STORAGE_KEY])).toEqual(validSave)
  })
})
