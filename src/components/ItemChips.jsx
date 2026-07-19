import { Fragment } from 'react'

// variant：'love' 最愛（seal 紅）；'loathe' 最討厭（seal 紅＋刪除線）；預設一般禮物/材料。樣式規範見 DESIGN.md §Chips
function Chip({ item, tone }) {
  const label = item.jp ? `${item.zh}（${item.jp}）` : (item.zh ?? item.text)
  if (item.href) {
    return (
      <a href={item.href} className={`chip-torn inline-block px-2 py-0.5 text-sm hover:underline ${tone}`}>
        {label}
      </a>
    )
  }
  return (
    <span className={`chip-torn text-ink/70 inline-block border-dashed px-2 py-0.5 text-sm ${tone}`}>
      {label}
    </span>
  )
}

function chipKey(item) {
  return `${item.zh ?? item.text}-${item.jp}`
}

export function ItemChips({ items, align = 'end', variant }) {
  if (!items || items.length === 0) return <span>—</span>

  const tone =
    variant === 'love'
      ? 'border-seal/70 text-seal font-medium'
      : variant === 'loathe'
        ? 'border-seal/70 text-seal font-medium line-through'
        : ''

  return (
    <ul className={`flex flex-wrap gap-1.5 ${align === 'start' ? 'justify-start' : 'justify-end'}`}>
      {items.map((item) =>
        // 「A 或 B」擇一群組：chips 之間以「或」相接，視為同一項
        item.alternatives ? (
          <li
            key={item.alternatives.map(chipKey).join('|')}
            className="flex flex-wrap items-center gap-1"
          >
            {item.alternatives.map((alt, index) => (
              <Fragment key={chipKey(alt)}>
                {index > 0 ? <span className="text-ink/50 text-xs">或</span> : null}
                <Chip item={alt} tone={tone} />
              </Fragment>
            ))}
          </li>
        ) : (
          <li key={chipKey(item)}>
            <Chip item={item} tone={tone} />
          </li>
        ),
      )}
    </ul>
  )
}
