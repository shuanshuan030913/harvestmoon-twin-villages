import { advanceDay } from '../utils/gameCalendar.js'
import { findRemindersForDate } from '../utils/reminders.js'
import { saveSave } from '../utils/storage.js'

export function advanceDayUseCase(
  save,
  { characters = [], festivals = [] } = {},
  storage = globalThis.localStorage,
) {
  const calendar = advanceDay(save.calendar)
  const newSave = { ...save, calendar }
  saveSave(newSave, storage)

  return {
    save: newSave,
    reminders: findRemindersForDate(calendar, { characters, festivals }),
  }
}
