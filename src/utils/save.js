export const CURRENT_SCHEMA_VERSION = 1

export function createEmptySave() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    calendar: { year: 1, season: '春', day: 1 },
    plots: [],
    animals: [],
    animalsUpdatedAt: null,
    checklists: {},
  }
}

// Keyed by the version being migrated *from* -> function returning the save
// upgraded to that version + 1.
const migrations = {
  // v0（早期草稿，缺 checklists 欄位）→ v1：補上 checklists: {}
  0: (save) => ({ ...save, schemaVersion: 1, checklists: save.checklists ?? {} }),
}

export function migrateSave(save) {
  if (!save || typeof save.schemaVersion !== 'number') return null
  if (save.schemaVersion > CURRENT_SCHEMA_VERSION) return null

  let current = save
  while (current.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const migrate = migrations[current.schemaVersion]
    if (!migrate) return null
    current = migrate(current)
  }
  return current
}
