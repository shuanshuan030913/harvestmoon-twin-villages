import { saveSave } from '../utils/storage.js'

export function toggleChecklistItemUseCase(
  save,
  checklistId,
  itemId,
  storage = globalThis.localStorage,
) {
  const current = save.checklists[checklistId] ?? []
  const updated = current.includes(itemId)
    ? current.filter((id) => id !== itemId)
    : [...current, itemId]

  const newSave = { ...save, checklists: { ...save.checklists, [checklistId]: updated } }
  saveSave(newSave, storage)
  return newSave
}
