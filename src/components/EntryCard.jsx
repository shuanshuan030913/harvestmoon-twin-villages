import { formatColumnValue } from '../utils/formatColumnValue.js'
import { ItemChips } from './ItemChips.jsx'

// 單欄卡片改「名稱左、值右一行」（U28，2026-07-20，recipes 首例：名稱＋5★賣價）；
// 名稱帶日文（使用者裁決：長名稱可能擠或換行，仍對齊全站「中文（日文）」慣例），
// 屬單欄版型的通用規則，非 recipes 專屬特例——日後其他 collection 縮到單欄時同套用。
function SingleColumnCard({ entry, column, collection }) {
  const name = entry.name ?? entry.title
  const displayName = entry.name_jp ? `${name}（${entry.name_jp}）` : name
  return (
    <li data-village={entry.village} className="h-full">
      <a
        href={`#/c/${collection}/${entry.slug}`}
        className="bg-(--village)/10 poke-tilt flex h-full items-center justify-between gap-3 rounded-2xl p-3"
      >
        <span className="text-(--village) font-bold">{displayName}</span>
        <span className="text-ink/80 shrink-0 text-sm">{formatColumnValue(entry[column.key], column)}</span>
      </a>
    </li>
  )
}

// 總覽模式（U56，2026-07-23）：食材/廚具平常縮進篩選器與明細頁，這裡額外攤開，
// 讓玩家一次掃過整批料理找食材，不用逐一點開。食材 chip 自己也是連結（可點去
// 該食材條目頁），跟名稱／價格那個連結是手足關係、不能巢狀兩個 <a>（無效 HTML），
// 所以外層改回 <div> 當卡片容器，名稱/價格行自己包一個 <a>。
function RecipeOverviewCard({ entry, collection }) {
  const displayName = entry.name_jp ? `${entry.name}（${entry.name_jp}）` : entry.name
  return (
    <li data-village={entry.village} className="h-full">
      <div className="bg-(--village)/10 flex h-full flex-col gap-2 rounded-2xl p-3">
        <a
          href={`#/c/${collection}/${entry.slug}`}
          className="poke-tilt flex items-center justify-between gap-3"
        >
          <span className="text-(--village) font-bold">{displayName}</span>
          <span className="text-ink/80 shrink-0 text-sm">{entry.sell_price_5star} G</span>
        </a>
        {entry.cookware ? (
          <span className="border-ink/40 text-ink/60 w-fit rounded px-1.5 py-0.5 text-xs">
            {entry.cookware}
          </span>
        ) : null}
        <ItemChips items={entry.ingredientsLinks} align="start" />
      </div>
    </li>
  )
}

export function EntryCard({ entry, config, collection, overview }) {
  if (overview && config.overview) {
    return <RecipeOverviewCard entry={entry} collection={collection} />
  }

  if (config.columns.length === 1) {
    return <SingleColumnCard entry={entry} column={config.columns[0]} collection={collection} />
  }

  return (
    <li data-village={entry.village} className="h-full">
      <a
        href={`#/c/${collection}/${entry.slug}`}
        className="bg-(--village)/10 poke-tilt block h-full rounded-2xl p-3"
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
