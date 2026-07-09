export function ItemChips({ items, align = 'end' }) {
  if (!items || items.length === 0) return <span>—</span>

  return (
    <ul className={`flex flex-wrap gap-1 ${align === 'start' ? 'justify-start' : 'justify-end'}`}>
      {items.map((item) => (
        <li key={`${item.zh}-${item.jp}`}>
          {item.href ? (
            <a
              href={item.href}
              className="bg-parchment border-(--village) rounded-full border px-2 py-0.5 text-xs hover:underline"
            >
              {item.zh}（{item.jp}）
            </a>
          ) : (
            <span className="text-ink/70 rounded-full border border-dashed px-2 py-0.5 text-xs">
              {item.zh}（{item.jp}）
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
