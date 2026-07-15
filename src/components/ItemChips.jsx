// variant：'love' 最愛（seal 紅）；預設一般禮物/材料。樣式規範見 DESIGN.md §Chips
export function ItemChips({ items, align = 'end', variant }) {
  if (!items || items.length === 0) return <span>—</span>

  const tone = variant === 'love' ? 'border-seal/70 text-seal font-medium' : ''

  return (
    <ul className={`flex flex-wrap gap-1.5 ${align === 'start' ? 'justify-start' : 'justify-end'}`}>
      {items.map((item) => (
        <li key={`${item.zh}-${item.jp}`}>
          {item.href ? (
            <a href={item.href} className={`chip-torn inline-block px-2 py-0.5 text-xs hover:underline ${tone}`}>
              {item.zh}（{item.jp}）
            </a>
          ) : (
            <span className={`chip-torn text-ink/70 inline-block border-dashed px-2 py-0.5 text-xs ${tone}`}>
              {item.zh}（{item.jp}）
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
