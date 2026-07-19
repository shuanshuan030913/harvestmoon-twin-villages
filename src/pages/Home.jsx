import { useSearchParams } from 'react-router'
import { Icon } from '../components/icons.jsx'
import { SearchInput } from '../components/SearchInput.jsx'
import animals from '../data/animals.json'
import characters from '../data/characters.json'
import crops from '../data/crops.json'
import festivals from '../data/festivals.json'
import fishes from '../data/fishes.json'
import insects from '../data/insects.json'
import minerals from '../data/minerals.json'
import recipes from '../data/recipes.json'
import villages from '../data/villages.json'
import { searchAllCollections } from '../utils/siteSearch.js'

const COLLECTIONS = { characters, crops, animals, recipes, fishes, insects, minerals, festivals, villages }

// 圖示一律走 icons.jsx sprite＋印章框（DESIGN.md：禁止 emoji 當圖示）
const ENTRIES = [
  { collection: 'characters', label: '角色', icon: 'person' },
  { collection: 'crops', label: '作物', icon: 'wheat' },
  { collection: 'animals', label: '動物', icon: 'sheep' },
  { collection: 'recipes', label: '料理', icon: 'pot' },
  { collection: 'fishes', label: '魚類', icon: 'fish' },
  { collection: 'insects', label: '昆蟲', icon: 'bug' },
  { collection: 'minerals', label: '礦物', icon: 'gem' },
  { collection: 'festivals', label: '節慶', icon: 'flag' },
  { collection: 'villages', label: '村莊', icon: 'village' },
]

const COLLECTION_LABELS = Object.fromEntries(ENTRIES.map(({ collection, label }) => [collection, label]))

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
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  function updateQuery(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <label className="border-ink/45 focus-within:border-ink mt-1 flex items-center gap-2 border-b-2 border-dashed px-1 focus-within:border-solid">
        <Icon id="search" className="text-ink/50 h-4 w-4 shrink-0" />
        <SearchInput
          value={query}
          onChange={updateQuery}
          placeholder="搜尋角色、作物、料理…"
          className="placeholder:text-ink/50 w-full bg-transparent py-2 text-sm focus:outline-none"
        />
      </label>

      {query.trim() ? (
        <SearchResults query={query} />
      ) : (
        <>
          <div className="sticker-grid mt-6 grid grid-cols-3 gap-x-3 gap-y-4 md:grid-cols-5 md:gap-x-4">
            {ENTRIES.map(({ collection, label, icon }) => (
              <a
                key={collection}
                href={`#/c/${collection}`}
                className="sticker flex flex-col items-center gap-1.5 px-2 pt-3 pb-2 text-center"
              >
                <span className="stamp">
                  <Icon id={icon} className="h-[22px] w-[22px]" />
                </span>
                <span className="font-hand text-sm font-bold">{label}</span>
                <span className="text-ink/55 text-xs">
                  {COLLECTIONS[collection].length} 筆
                </span>
              </a>
            ))}
            {/* md 起行事曆併入貼紙牆湊滿 5×2；行動版維持 3×3＋下方緞帶列 */}
            <a
              href="#/calendar"
              className="sticker hidden flex-col items-center gap-1.5 px-2 pt-3 pb-2 text-center md:flex"
            >
              <span className="stamp">
                <Icon id="cal" className="h-[22px] w-[22px]" />
              </span>
              <span className="font-hand text-sm font-bold">行事曆</span>
              <span className="text-ink/55 text-xs">生日・節慶</span>
            </a>
          </div>
          {/* 行事曆入口：緞帶列（U9 自導覽降級後的首頁入口） */}
          <a
            href="#/calendar"
            className="border-ink/50 bg-soil/15 mt-5 flex items-center gap-2.5 rounded-lg border-[1.5px] border-dashed px-4 py-2.5 text-sm md:hidden"
          >
            <Icon id="cal" className="h-4 w-4 shrink-0" />
            <span className="font-hand font-bold">行事曆 — 生日・節慶速查</span>
            <span className="text-ink/50 ml-auto">→</span>
          </a>
        </>
      )}
    </div>
  )
}

export default Home
