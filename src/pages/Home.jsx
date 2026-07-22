import { useSearchParams } from 'react-router'
import { Icon } from '../components/icons.jsx'
import { SearchInput } from '../components/SearchInput.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import animals from '../data/animals.json'
import characters from '../data/characters.json'
import crops from '../data/crops.json'
import festivals from '../data/festivals.json'
import fishes from '../data/fishes.json'
import guides from '../data/guides.json'
import insects from '../data/insects.json'
import items from '../data/items.json'
import minerals from '../data/minerals.json'
import pets from '../data/pets.json'
import recipes from '../data/recipes.json'
import villages from '../data/villages.json'
import { searchAllCollections } from '../utils/siteSearch.js'

const COLLECTIONS = {
  characters,
  crops,
  animals,
  pets,
  recipes,
  fishes,
  insects,
  minerals,
  festivals,
  villages,
  items,
  guides,
}

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

const COLLECTION_LABELS = {
  ...Object.fromEntries(ENTRIES.map(({ collection, label }) => [collection, label])),
  guides: '攻略',
  pets: '寵物',
  items: '物品',
}

const COLLECTION_ICONS = {
  ...Object.fromEntries(ENTRIES.map(({ collection, icon }) => [collection, icon])),
  guides: 'book',
  pets: 'paw',
  items: 'box',
}

// guides 的明細路由是 #/guide/:system/:slug，其餘 collection 是 #/c/:collection/:slug
function entryHref(collection, entry) {
  return collection === 'guides' ? `#/guide/${entry.system}/${entry.slug}` : `#/c/${collection}/${entry.slug}`
}

function SearchResults({ query }) {
  const results = searchAllCollections(COLLECTIONS, query)
  const groups = Object.entries(results)

  if (groups.length === 0) {
    return <p className="text-ink/60 mt-4 text-sm">查無結果</p>
  }

  // 分組版型比照攻略總覽頁（GuidesIndexPage）：印章圖示＋手寫標籤＋筆數，
  // 組內條目用資訊列同款點狀虛線行（2026-07-21 使用者回饋：舊版純文字清單無設計）。
  return (
    <div className="mt-4 flex flex-col gap-6">
      {groups.map(([collection, entries]) => (
        <section key={collection}>
          <div className="flex items-center gap-2.5">
            <span className="stamp">
              <Icon id={COLLECTION_ICONS[collection] ?? 'search'} className="h-[18px] w-[18px]" />
            </span>
            <h2 className="font-hand text-base font-bold">{COLLECTION_LABELS[collection] ?? collection}</h2>
            <span className="text-ink/50 text-xs">{entries.length} 筆</span>
          </div>
          <ul className="mt-1.5">
            {entries.map((entry) => (
              <li key={entry.slug} data-village={entry.village} className="border-ink/40 border-b-[1.5px] border-dotted">
                <a
                  href={entryHref(collection, entry)}
                  className="text-(--village) hover:bg-parchment -mx-2 flex rounded-lg px-2 py-2.5 text-sm"
                >
                  {entry.name ?? entry.displayTitle ?? entry.title}
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
  // 首頁維持站名本身（index.html 預設 title），換頁回來時重置離開其他頁面留下的分頁標題
  useDocumentTitle()
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
          {/* 貼紙牆改 flex-wrap＋justify-center（2026-07-22 修正，取代原本 grid）：
              grid 的最後一列不滿時會貼齊左邊留白，flex-wrap 才能讓不滿版的最後一列
              置中。每張貼紙固定寬度（扣掉 gap 換算），行動 3 欄／桌機 5 欄。 */}
          <div className="sticker-grid mt-6 flex flex-wrap justify-center gap-x-3 gap-y-4 md:gap-x-4">
            {ENTRIES.map(({ collection, label, icon }) => (
              <a
                key={collection}
                href={`#/c/${collection}`}
                className="sticker flex shrink-0 grow-0 basis-[calc(33.333%-0.5rem)] flex-col items-center gap-1.5 px-2 pt-3 pb-2 text-center md:basis-[calc(20%-0.8rem)]"
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
            {/* md 起行事曆併入貼紙牆；行動版維持下方緞帶列（無對應格位可併，
                3 欄版面在下面已經跟寵物/物品/攻略湊成整數列，不需要它加入） */}
            <a
              href="#/calendar"
              className="sticker hidden shrink-0 grow-0 basis-[calc(20%-0.8rem)] flex-col items-center gap-1.5 px-2 pt-3 pb-2 text-center md:flex"
            >
              <span className="stamp">
                <Icon id="cal" className="h-[22px] w-[22px]" />
              </span>
              <span className="font-hand text-sm font-bold">行事曆</span>
              <span className="text-ink/55 text-xs">生日・節慶</span>
            </a>
            {/* 寵物／物品／攻略：原本是緞帶列，改成同款貼紙卡（2026-07-22 使用者裁決），
                跟上面的 collection 貼紙同一個 flex-wrap 容器裡，不滿版的最後一列
                會自動置中，不用再另外處理版面 */}
            <a
              href="#/c/pets"
              className="sticker flex shrink-0 grow-0 basis-[calc(33.333%-0.5rem)] flex-col items-center gap-1.5 px-2 pt-3 pb-2 text-center md:basis-[calc(20%-0.8rem)]"
            >
              <span className="stamp">
                <Icon id="paw" className="h-[22px] w-[22px]" />
              </span>
              <span className="font-hand text-sm font-bold">寵物</span>
              <span className="text-ink/55 text-xs">{pets.length} 筆</span>
            </a>
            <a
              href="#/c/items"
              className="sticker flex shrink-0 grow-0 basis-[calc(33.333%-0.5rem)] flex-col items-center gap-1.5 px-2 pt-3 pb-2 text-center md:basis-[calc(20%-0.8rem)]"
            >
              <span className="stamp">
                <Icon id="box" className="h-[22px] w-[22px]" />
              </span>
              <span className="font-hand text-sm font-bold">物品</span>
              <span className="text-ink/55 text-xs">{items.length} 筆</span>
            </a>
            <a
              href="#/guides"
              className="sticker flex shrink-0 grow-0 basis-[calc(33.333%-0.5rem)] flex-col items-center gap-1.5 px-2 pt-3 pb-2 text-center md:basis-[calc(20%-0.8rem)]"
            >
              <span className="stamp">
                <Icon id="book" className="h-[22px] w-[22px]" />
              </span>
              <span className="font-hand text-sm font-bold">攻略</span>
              <span className="text-ink/55 text-xs">{guides.length} 篇</span>
            </a>
          </div>
          {/* 行事曆入口：緞帶列（U9 自導覽降級後的首頁入口），只在行動版顯示——
              桌機併入上方貼紙牆 */}
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
