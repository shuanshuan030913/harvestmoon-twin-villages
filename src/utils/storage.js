export const STORAGE_KEY = 'hmtv:save:v1'

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
