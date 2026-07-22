import { useState } from 'react'
import { useParams } from 'react-router'
import { DATA_BY_COLLECTION } from '../data/collectionsIndex.js'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'
import { formatColumnValue } from '../utils/formatColumnValue.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
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

      <div className="mt-3 flex flex-wrap gap-1.5">
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
        <ul className="mt-4 flex flex-col">
          {results.map(({ entry, seasons, note, raw }, i) => (
            <li key={`${entry.slug}-${i}`} className="border-ink/40 border-b-[1.5px] border-dotted">
              <a
                href={`#/c/${collection}/${entry.slug}`}
                className="hover:bg-parchment -mx-2 flex flex-col rounded-lg px-2 py-2"
              >
                <span className="underline decoration-dotted underline-offset-2">
                  {entry.name}
                  {entry.name_jp ? <span className="text-ink/50">（{entry.name_jp}）</span> : null}
                </span>
                <span className="text-ink/60 mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                  <span>
                    {formatColumnValue(seasons, {})}
                    {lookup.hasTime && entry.time ? `・${formatColumnValue(entry.time, {})}` : ''}
                    {note ? `・${note}` : ''}
                    {raw ? <span className="text-ink/40 text-xs"> （原文：{raw}）</span> : null}
                  </span>
                  {entry.sell_price != null ? <span>{formatColumnValue(entry.sell_price, { unit: 'G' })}</span> : null}
                </span>
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
