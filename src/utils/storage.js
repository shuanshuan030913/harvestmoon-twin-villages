import { migrateSave } from './save.js'

export const STORAGE_KEY = 'hmtv:save:v1'
export const BACKUP_STORAGE_KEY = 'hmtv:save:backup'

export function loadSave(storage = globalThis.localStorage) {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return { save: null, error: null }

  try {
    return { save: JSON.parse(raw), error: null }
  } catch {
    return { save: null, error: 'parse-failed' }
  }
}

export function saveSave(save, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(save))
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

// 讀檔 + 逐版遷移至現行 schema，遷移後立即回寫。
export function loadSaveWithMigration(storage = globalThis.localStorage) {
  const { save, error } = loadSave(storage)
  if (error || save === null) return { save, error }

  const migrated = migrateSave(save)
  if (migrated === null) return { save: null, error: 'schema-version-rejected' }

  if (migrated.schemaVersion !== save.schemaVersion) {
    saveSave(migrated, storage)
  }
  return { save: migrated, error: null }
}
