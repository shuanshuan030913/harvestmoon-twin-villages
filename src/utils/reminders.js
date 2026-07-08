import { parseSeasonDay } from './gameCalendar.js'

function seasonMatches(calendarSeason, entrySeason) {
  if (Array.isArray(entrySeason)) return entrySeason.includes(calendarSeason)
  return entrySeason === calendarSeason
}

export function findRemindersForDate(calendar, { characters = [], festivals = [] } = {}) {
  const characterReminders = characters.filter((character) => {
    const birthday = parseSeasonDay(character.birthday)
    return birthday && birthday.season === calendar.season && birthday.day === calendar.day
  })

  const festivalReminders = festivals.filter(
    (festival) => seasonMatches(calendar.season, festival.season) && festival.day === calendar.day,
  )

  return { characters: characterReminders, festivals: festivalReminders }
}
