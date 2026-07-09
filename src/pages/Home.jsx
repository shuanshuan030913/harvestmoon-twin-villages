import { useState } from 'react'
import animals from '../data/animals.json'
import characters from '../data/characters.json'
import crops from '../data/crops.json'
import festivals from '../data/festivals.json'
import fishes from '../data/fishes.json'
import insects from '../data/insects.json'
import minerals from '../data/minerals.json'
import recipes from '../data/recipes.json'
import villages from '../data/villages.json'
import { findRemindersForDate } from '../utils/reminders.js'
import { searchAllCollections } from '../utils/siteSearch.js'
import { loadSave } from '../utils/storage.js'

const COLLECTIONS = { characters, crops, animals, recipes, fishes, insects, minerals, festivals, villages }

const ENTRIES = [
  { collection: 'characters', label: '角色', icon: '👤' },
  { collection: 'crops', label: '作物', icon: '🌾' },
  { collection: 'animals', label: '動物', icon: '🐑' },
  { collection: 'recipes', label: '料理', icon: '🍳' },
  { collection: 'fishes', label: '魚類', icon: '🐟' },
  { collection: 'insects', label: '昆蟲', icon: '🐛' },
  { collection: 'minerals', label: '礦物', icon: '💎' },
  { collection: 'festivals', label: '節慶', icon: '🎉' },
  { collection: 'villages', label: '村莊', icon: '🏘️' },
]

const COLLECTION_LABELS = Object.fromEntries(ENTRIES.map(({ collection, label }) => [collection, label]))

function TodayReminders() {
  const { save } = loadSave()
  if (save === null) return null

  const reminders = findRemindersForDate(save.calendar, { characters, festivals })
  const items = [...reminders.characters.map((c) => c.name), ...reminders.festivals.map((f) => f.name)]

  return (
    <section className="border-ink/20 mb-4 rounded-2xl border-2 border-dashed p-3">
      <h2 className="text-sm font-bold">今日提醒</h2>
      {items.length > 0 ? (
        <ul className="mt-1 text-sm">
          {items.map((name) => (
            <li key={name}>🎂 {name}</li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/50 mt-1 text-sm">今日無提醒</p>
      )}
    </section>
  )
}

function SearchResults({ query }) {
  const results = searchAllCollections(COLLECTIONS, query)
  const groups = Object.entries(results)

  if (groups.length === 0) {
    return <p className="text-ink/60 mt-4 text-sm">查無結果</p>
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {groups.map(([collection, entries]) => (
        <section key={collection}>
          <h2 className="text-sm font-bold">{COLLECTION_LABELS[collection] ?? collection}</h2>
          <ul className="mt-1 text-sm">
            {entries.map((entry) => (
              <li key={entry.slug}>
                <a href={`#/c/${collection}/${entry.slug}`} className="hover:underline">
                  {entry.name ?? entry.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Home() {
  const [query, setQuery] = useState('')

  return (
    <div>
      <h1 className="text-xl font-bold">牧場物語 雙子村 攻略網站</h1>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="搜尋角色、作物、料理…"
        className="border-ink/30 bg-cream mt-4 w-full rounded-full border px-4 py-2 text-sm"
      />

      {query.trim() ? (
        <SearchResults query={query} />
      ) : (
        <>
          <TodayReminders />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {ENTRIES.map(({ collection, label, icon }) => (
              <a
                key={collection}
                href={`#/c/${collection}`}
                className="bg-cream border-ink/20 flex flex-col items-center gap-1 rounded-2xl border p-3 text-center shadow-sm"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium">{label}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Home
