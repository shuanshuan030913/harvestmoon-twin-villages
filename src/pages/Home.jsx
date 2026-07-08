import characters from '../data/characters.json'
import festivals from '../data/festivals.json'
import { findRemindersForDate } from '../utils/reminders.js'
import { loadSave } from '../utils/storage.js'

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

function Home() {
  return (
    <div>
      <h1 className="text-xl font-bold">牧場物語 雙子村 攻略網站</h1>

      <input
        type="search"
        placeholder="搜尋角色、作物、料理…"
        className="border-ink/30 bg-cream mt-4 w-full rounded-full border px-4 py-2 text-sm"
        disabled
      />

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
    </div>
  )
}

export default Home
