import { parseSeasonDay } from './gameCalendar.js'

function seasonMatches(calendarSeason, entrySeason) {
  if (Array.isArray(entrySeason)) return entrySeason.includes(calendarSeason)
  return entrySeason === calendarSeason
}

// 多數節慶是單一 (season, day)；少數（如花之日、料理大會）用 occurrences
// 陣列表達「同季多日」或「依村莊而不同日」，見 .spec/todo.md C6。
function festivalOccursOn(festival, calendar) {
  if (Array.isArray(festival.occurrences)) {
    return festival.occurrences.some(
      (occurrence) => occurrence.season === calendar.season && occurrence.day === calendar.day,
    )
  }
  return seasonMatches(calendar.season, festival.season) && festival.day === calendar.day
}

export function findRemindersForDate(calendar, { characters = [], festivals = [] } = {}) {
  const characterReminders = characters.filter((character) => {
    const birthday = parseSeasonDay(character.birthday)
    return birthday && birthday.season === calendar.season && birthday.day === calendar.day
  })

  const festivalReminders = festivals.filter((festival) => festivalOccursOn(festival, calendar))

  return { characters: characterReminders, festivals: festivalReminders }
}
