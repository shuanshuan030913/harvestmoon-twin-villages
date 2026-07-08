import { createGameDate } from './gameCalendar.js'
import { BACKUP_STORAGE_KEY, loadSave, saveSave } from './storage.js'

export function buildExportPayload(save, now = new Date()) {
  return { ...save, exportedAt: now.toISOString() }
}

export function buildExportFilename(now = new Date()) {
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `hmtv-save-${yyyy}${mm}${dd}.json`
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportSave(save, now = new Date()) {
  const payload = buildExportPayload(save, now)
  downloadJSON(buildExportFilename(now), payload)
  return payload
}

function isValidSave(save) {
  if (!save || typeof save.schemaVersion !== 'number') return false
  const { year, season, day } = save.calendar ?? {}
  return createGameDate(year, season, day) !== null
}

export function importSave(jsonString, storage = globalThis.localStorage) {
  let parsed
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    return { ok: false, error: 'parse-failed' }
  }

  if (!isValidSave(parsed)) {
    return { ok: false, error: 'invalid' }
  }

  const { save: existing } = loadSave(storage)
  if (existing !== null) {
    storage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(existing))
  }

  const { exportedAt: _exportedAt, ...save } = parsed
  const result = saveSave(save, storage)
  if (!result.ok) return { ok: false, error: 'write-failed' }

  return { ok: true }
}
