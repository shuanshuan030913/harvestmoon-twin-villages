import { describe, expect, it } from 'vitest'
import { toggleChecklistItemUseCase } from './checklistUseCase.js'

function createMockStorage() {
  const data = {}
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

describe('toggleChecklistItemUseCase', () => {
  it('checking an item adds it to the checklist and persists the save', () => {
    const save = { checklists: {} }
    const storage = createMockStorage()

    const result = toggleChecklistItemUseCase(save, 'bell-jewels', '紅色', storage)

    expect(result.checklists['bell-jewels']).toEqual(['紅色'])
    expect(JSON.parse(storage.getItem('hmtv:save:v1')).checklists['bell-jewels']).toEqual([
      '紅色',
    ])
  })

  it('toggling an already-checked item unchecks it', () => {
    const save = { checklists: { 'bell-jewels': ['紅色', '橙色'] } }
    const storage = createMockStorage()

    const result = toggleChecklistItemUseCase(save, 'bell-jewels', '紅色', storage)

    expect(result.checklists['bell-jewels']).toEqual(['橙色'])
  })
})
