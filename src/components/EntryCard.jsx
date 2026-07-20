import { formatColumnValue } from '../utils/formatColumnValue.js'

// 單欄卡片改「名稱左、值右一行」（U28，2026-07-20，recipes 首例：名稱＋5★賣價）；
// 名稱帶日文（使用者裁決：長名稱可能擠或換行，仍對齊全站「中文（日文）」慣例），
// 屬單欄版型的通用規則，非 recipes 專屬特例——日後其他 collection 縮到單欄時同套用。
function SingleColumnCard({ entry, column, collection }) {
  const name = entry.name ?? entry.title
  const displayName = entry.name_jp ? `${name}（${entry.name_jp}）` : name
  return (
    <li data-village={entry.village}>
      <a
        href={`#/c/${collection}/${entry.slug}`}
        className="bg-cream border-(--village) flex items-center justify-between gap-3 rounded-2xl border-2 p-3"
      >
        <span className="text-(--village) font-bold">{displayName}</span>
        <span className="text-ink/80 shrink-0 text-sm">{formatColumnValue(entry[column.key], column)}</span>
      </a>
    </li>
  )
}

export function EntryCard({ entry, config, collection }) {
  if (config.columns.length === 1) {
    return <SingleColumnCard entry={entry} column={config.columns[0]} collection={collection} />
  }

  return (
    <li data-village={entry.village}>
      <a
        href={`#/c/${collection}/${entry.slug}`}
        className="bg-cream border-(--village) block rounded-2xl border-2 p-3"
      >
        <span className="text-(--village) font-bold">{entry.name ?? entry.title}</span>
        <dl className="divide-ink/20 mt-1 divide-y divide-dashed text-sm">
          {config.columns.map((column) => (
            <div key={column.key} className="flex justify-between gap-3 py-1">
              <dt className="text-ink/60 shrink-0">{column.label}</dt>
              <dd className="text-right">{formatColumnValue(entry[column.key], column)}</dd>
            </div>
          ))}
        </dl>
      </a>
    </li>
  )
}
