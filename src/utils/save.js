export const CURRENT_SCHEMA_VERSION = 1

export function createEmptySave() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    calendar: { year: 1, season: '春', day: 1 },
    plots: [],
    animals: [],
    checklists: {},
  }
}

// Keyed by the version being migrated *from* -> function returning the save
// upgraded to that version + 1. Empty until schemaVersion 1 has a successor.
const migrations = {}

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
