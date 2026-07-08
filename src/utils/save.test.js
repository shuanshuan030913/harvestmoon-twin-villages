import { describe, expect, it } from 'vitest'
import { createEmptySave, CURRENT_SCHEMA_VERSION, migrateSave } from './save.js'

describe('createEmptySave', () => {
  it('creates a v1 save with empty collections', () => {
    expect(createEmptySave()).toEqual({
      schemaVersion: 1,
      calendar: { year: 1, season: '春', day: 1 },
      plots: [],
      animals: [],
      checklists: {},
    })
  })
})

describe('migrateSave', () => {
  it('passes through a save already at the current version', () => {
    const save = createEmptySave()
    expect(migrateSave(save)).toEqual(save)
  })

  it('rejects a save with schemaVersion higher than current', () => {
    const save = { ...createEmptySave(), schemaVersion: CURRENT_SCHEMA_VERSION + 1 }
    expect(migrateSave(save)).toBeNull()
  })

  it('rejects a save with a missing/invalid schemaVersion', () => {
    expect(migrateSave({ ...createEmptySave(), schemaVersion: undefined })).toBeNull()
    expect(migrateSave(null)).toBeNull()
  })
})
