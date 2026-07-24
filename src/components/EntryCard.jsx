import { formatColumnValue } from '../utils/formatColumnValue.js'

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

// 料理列表卡固定顯示食材/廚具，不再有切換鈕（U66，2026-07-24，取代 U56 的
// 「總覽模式」開關——原本的非總覽一行卡對應「玩家知道菜名只想查價錢」的情境，
// 但沒開始做菜就不會記得菜名，這個情境本來就不成立，拿掉切換鈕直接固定顯示）。
// 視覺（U60，2026-07-23 使用者拍板方向 C，出 artifact 三方案對稿選定）：
// 原本廚具用矩形描邊 tag、食材用 chip-torn，兩種「框」語言疊在同張卡片上，
// 字級也一路從標題掉到 12px，讀起來混亂又牴觸 DESIGN.md「內容文字不得低於
// text-sm」的規則。改成廚具/食材都是純文字，字級統一 text-sm，靠 ink 濃淡
// （不靠框線）分層；代價是食材不再是可點連結（`ItemChips` 的可點特性只留在
// 其餘用到它的地方，如角色禮物清單、條目頁「食材」區塊），使用者知情選定。
function RecipeCard({ entry, collection }) {
  const displayName = entry.name_jp ? `${entry.name}（${entry.name_jp}）` : entry.name
  return (
    <li data-village={entry.village} className="h-full">
      <a
        href={`#/c/${collection}/${entry.slug}`}
        className="bg-(--village)/10 poke-tilt flex h-full flex-col gap-1.5 rounded-2xl p-3"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-(--village) font-bold">{displayName}</span>
          <span className="text-ink/80 shrink-0 text-sm">{entry.sell_price_5star} G</span>
        </div>
        {entry.cookware ? <p className="text-ink/55 text-sm">{entry.cookware}</p> : null}
        {entry.ingredients?.length ? <p className="text-ink text-sm">{entry.ingredients.join('、')}</p> : null}
      </a>
    </li>
  )
}

export function EntryCard({ entry, config, collection }) {
  if (config.richCard) {
    return <RecipeCard entry={entry} collection={collection} />
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
