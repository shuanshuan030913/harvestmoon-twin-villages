import { useSearchParams } from 'react-router'
import { Icon } from '../components/icons.jsx'
import characters from '../data/characters.json'
import festivals from '../data/festivals.json'
import { buildCalendar } from '../utils/calendarAggregate.js'
import { SEASONS } from '../utils/gameCalendar.js'

const CHARACTER_ITEMS = characters
  .filter((character) => character.birthday)
  .map((character) => ({ kind: 'characters', slug: character.slug, name: character.name, date: character.birthday }))

function festivalName(festival, occurrence) {
  return occurrence?.village ? `${festival.name}（${occurrence.village}）` : festival.name
}

const FESTIVAL_ITEMS = festivals.flatMap((festival) => {
  if (Array.isArray(festival.occurrences)) {
    return festival.occurrences.map((occurrence) => ({
      kind: 'festivals',
      slug: festival.slug,
      name: festivalName(festival, occurrence),
      date: `${occurrence.season}-${occurrence.day}`,
    }))
  }

  return (Array.isArray(festival.season) ? festival.season : [festival.season]).map((season) => ({
    kind: 'festivals',
    slug: festival.slug,
    name: festival.name,
    date: `${season}-${festival.day}`,
  }))
})

const CALENDAR = buildCalendar([...CHARACTER_ITEMS, ...FESTIVAL_ITEMS], (item) => item.date)

function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSeason = SEASONS.includes(searchParams.get('season')) ? searchParams.get('season') : SEASONS[0]

  function selectSeason(season) {
    const next = new URLSearchParams(searchParams)
    next.set('season', season)
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <h1 className="font-hand text-xl font-bold">行事曆</h1>

      <div className="mt-3 flex gap-2">
        {SEASONS.map((season) => (
          <button
            key={season}
            type="button"
            onClick={() => selectSeason(season)}
            className={`font-hand rounded-full px-3.5 py-1 text-sm font-bold transition-colors ${
              season === activeSeason
                ? 'bg-ink text-cream'
                : 'border-ink/40 text-ink/70 hover:bg-ink/10 border border-dashed'
            }`}
          >
            {season}
          </button>
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {CALENDAR[activeSeason].map((items, index) => {
          const day = index + 1
          return (
            <li key={day} className="border-ink/35 bg-cream min-h-16 rounded-lg border-[1.5px] border-dotted p-1 text-sm">
              <p className="font-hand text-ink/50">{day}</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {items.map((item) => (
                  <li key={`${item.kind}-${item.slug}`}>
                    <a
                      href={`#/c/${item.kind}/${item.slug}`}
                      className="text-ink flex items-center gap-1 hover:underline"
                    >
                      <Icon
                        id={item.kind === 'festivals' ? 'flag' : 'cake'}
                        className="text-ink/60 h-3 w-3 shrink-0"
                      />
                      <span className="truncate">{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default CalendarPage
