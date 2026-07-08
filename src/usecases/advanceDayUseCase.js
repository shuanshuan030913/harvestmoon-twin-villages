import { advanceDay, parseSeasonDay } from '../utils/gameCalendar.js'
import { saveSave } from '../utils/storage.js'

function seasonMatches(calendarSeason, entrySeason) {
  if (Array.isArray(entrySeason)) return entrySeason.includes(calendarSeason)
  return entrySeason === calendarSeason
}

export function advanceDayUseCase(
  save,
  { characters = [], festivals = [] } = {},
  storage = globalThis.localStorage,
) {
  const calendar = advanceDay(save.calendar)
  const newSave = { ...save, calendar }
  saveSave(newSave, storage)

  const characterReminders = characters.filter((character) => {
    const birthday = parseSeasonDay(character.birthday)
    return birthday && birthday.season === calendar.season && birthday.day === calendar.day
  })

  const festivalReminders = festivals.filter(
    (festival) => seasonMatches(calendar.season, festival.season) && festival.day === calendar.day,
  )

  return {
    save: newSave,
    reminders: { characters: characterReminders, festivals: festivalReminders },
  }
}
