import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildExportFilename, buildExportPayload, exportSave } from './exportImport.js'

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
