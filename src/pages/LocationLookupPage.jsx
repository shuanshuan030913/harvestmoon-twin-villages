import { useState } from 'react'
import { useParams } from 'react-router'
import { DATA_BY_COLLECTION } from '../data/collectionsIndex.js'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'
import { formatColumnValue } from '../utils/formatColumnValue.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useHeaderHeight } from '../hooks/useHeaderHeight.js'
import { useStuck } from '../hooks/useStuck.js'
import {
  FISH_LOCATIONS,
  INSECT_LOCATIONS,
  UNCERTAIN_KEY,
  buildLocationIndex,
  parseFishLocation,
  parseInsectLocation,
} from '../utils/locationBreakdown.js'

// 「依地點查詢」頁（U33，2026-07-21）：選地點→看該地點各季節（昆蟲另含時段）
// 能捕獲什麼，與 collection 列表頁的「選條件→看符合的條目」互補。
const LOOKUP_CONFIGS = {
  fishes: { locations: FISH_LOCATIONS, parse: parseFishLocation, hasTime: false },
  insects: { locations: INSECT_LOCATIONS, parse: parseInsectLocation, hasTime: true },
}

function LocationChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-3 py-1 text-sm transition-colors md:min-h-0 ${
        active ? 'bg-ink text-parchment border-ink' : 'border-ink/30 bg-cream text-ink hover:bg-parchment'
      }`}
    >
      {label}
    </button>
  )
}

function LocationLookupPage() {
  const { collection } = useParams()
  const config = COLLECTION_CONFIGS[collection]
  const lookup = LOOKUP_CONFIGS[collection]
  const [selected, setSelected] = useState(null)
  useDocumentTitle(config ? `${config.label}地點查詢` : undefined)
  // 地點選項列 sticky 置頂（U69，2026-07-24 使用者回饋：往下捲動看結果時 chips
  // 列會捲走，要換地點得先捲回頂端）；top 偏移沿用 U68 剛做好的動態量測機制，
  // 不再寫死數字。這個頁面上方沒有 CollectionPage.jsx 那層篩選列，chips 列
  // 直接接在全域 header 下面。
  const headerHeight = useHeaderHeight()
  const [chipsSentinelRef, chipsStuck] = useStuck(headerHeight)

  if (!lookup || !config) {
    return <p className="text-ink/60 mt-3 text-sm">找不到此查詢頁（{collection}）。</p>
  }

  const entries = DATA_BY_COLLECTION[collection] ?? []
  const index = buildLocationIndex(entries, lookup.parse)
  const results = selected ? (index.get(selected) ?? []) : []

  return (
    <div>
      <h1 className="font-hand text-xl font-bold">{config.label}地點查詢</h1>
      <p className="text-ink/60 mt-1 text-sm">選一個地點，看看這裡各季節能捕獲什麼。</p>

      <div ref={chipsSentinelRef} />
      <div
        style={{ top: headerHeight }}
        className={`bg-cream sticky z-[5] flex flex-wrap gap-1.5 pt-3 pb-2 transition-shadow ${
          chipsStuck ? 'shadow-[0_4px_6px_-4px_rgba(74,55,40,0.18)]' : ''
        }`}
      >
        {lookup.locations.map((location) => (
          <LocationChip
            key={location}
            label={location}
            active={selected === location}
            onClick={() => setSelected(location)}
          />
        ))}
        {index.has(UNCERTAIN_KEY) ? (
          <LocationChip
            label="地點不確定"
            active={selected === UNCERTAIN_KEY}
            onClick={() => setSelected(UNCERTAIN_KEY)}
          />
        ) : null}
      </div>

      {selected ? (
        <ul className="mt-1 flex flex-col gap-2">
          {results.map(({ entry, seasons, note, raw }, i) => (
            <li key={`${entry.slug}-${i}`} data-village={entry.village}>
              <a
                href={`#/c/${collection}/${entry.slug}`}
                className="bg-(--village)/10 poke-tilt flex flex-col gap-1.5 rounded-2xl p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-(--village) font-bold">
                    {entry.name}
                    {entry.name_jp ? <span className="text-ink/50 font-normal">（{entry.name_jp}）</span> : null}
                  </span>
                  {entry.sell_price != null ? (
                    <span className="text-ink/80 shrink-0 text-sm">
                      {formatColumnValue(entry.sell_price, { unit: 'G' })}
                    </span>
                  ) : null}
                </div>
                <p className="text-ink/60 text-sm">
                  {formatColumnValue(seasons, {})}
                  {lookup.hasTime && entry.time ? `・${formatColumnValue(entry.time, {})}` : ''}
                  {note ? `・${note}` : ''}
                  {raw ? <span className="text-ink/40 text-xs"> （原文：{raw}）</span> : null}
                </p>
              </a>
            </li>
          ))}
          {results.length === 0 ? <p className="text-ink/50 mt-2 text-sm">這個地點沒有查到資料。</p> : null}
        </ul>
      ) : (
        <p className="text-ink/50 mt-4 text-sm">請先選擇一個地點。</p>
      )}
    </div>
  )
}

export default LocationLookupPage
