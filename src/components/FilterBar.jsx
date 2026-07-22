import { useSearchParams } from 'react-router'
import { parseMultiParam } from '../utils/collectionQuery.js'

function formatOptionLabel(value) {
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <div className="flex items-start gap-2">
      <p className="text-ink/60 flex min-h-11 shrink-0 items-center py-1 text-sm font-bold whitespace-nowrap md:min-h-0">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const value = String(option)
          const active = selected.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3 py-1 text-sm transition-colors md:min-h-0 ${
                active ? 'bg-ink text-parchment' : 'bg-ink/8 text-ink hover:bg-ink/15'
              }`}
            >
              {formatOptionLabel(option)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 展開式複選篩選面板（2026-07-14 使用者裁決，參照 jackjeanne-merch）：
// 同群組內複選為 OR、跨群組為 AND（組合邏輯在 collectionQuery.applyFilters）。
export function FilterBar({ config }) {
  const [searchParams, setSearchParams] = useSearchParams()

  function toggleValue(key, value) {
    const next = new URLSearchParams(searchParams)
    const current = parseMultiParam(searchParams.get(key))
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    if (updated.length > 0) next.set(key, updated.join(','))
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  function clearAll() {
    const next = new URLSearchParams(searchParams)
    for (const filter of config.filters) next.delete(filter.key)
    setSearchParams(next, { replace: true })
  }

  const hasSelection = config.filters.some((filter) => searchParams.get(filter.key))

  return (
    <div className="flex flex-col gap-3">
      {config.filters.map((filter) => (
        <ChipGroup
          key={filter.key}
          label={filter.label}
          options={filter.options}
          selected={parseMultiParam(searchParams.get(filter.key))}
          onToggle={(value) => toggleValue(filter.key, value)}
        />
      ))}
      {hasSelection ? (
        <div className="flex justify-end">
          <button type="button" onClick={clearAll} className="text-ink/60 text-xs underline">
            清除篩選
          </button>
        </div>
      ) : null}
    </div>
  )
}
