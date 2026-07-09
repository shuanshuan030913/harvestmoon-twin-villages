import { useSearchParams } from 'react-router'
import characters from '../data/characters.json'
import festivals from '../data/festivals.json'
import { buildCalendar } from '../utils/calendarAggregate.js'
import { SEASONS } from '../utils/gameCalendar.js'

const CHARACTER_ITEMS = characters
  .filter((character) => character.birthday)
  .map((character) => ({ kind: 'characters', slug: character.slug, name: character.name, date: character.birthday }))

const FESTIVAL_ITEMS = festivals.flatMap((festival) =>
  (Array.isArray(festival.season) ? festival.season : [festival.season]).map((season) => ({
    kind: 'festivals',
    slug: festival.slug,
    name: festival.name,
    date: `${season}-${festival.day}`,
  })),
)

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
      <h1 className="text-lg font-bold">行事曆</h1>

      <div className="mt-3 flex gap-2">
        {SEASONS.map((season) => (
          <button
            key={season}
            type="button"
            onClick={() => selectSeason(season)}
            className={`rounded-full border px-3 py-1 text-sm ${
              season === activeSeason ? 'bg-ink text-parchment border-ink' : 'border-ink/30 bg-cream'
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
            <li key={day} className="border-ink/20 bg-cream min-h-16 rounded-xl border p-1 text-xs">
              <p className="text-ink/50">{day}</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {items.map((item) => (
                  <li key={`${item.kind}-${item.slug}`}>
                    <a href={`#/c/${item.kind}/${item.slug}`} className="text-ink block truncate hover:underline">
                      {item.kind === 'festivals' ? '🎉' : '🎂'} {item.name}
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
