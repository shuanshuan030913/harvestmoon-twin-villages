import { useSearchParams } from 'react-router'
import { parseMultiParam } from '../utils/collectionQuery.js'

function formatOptionLabel(value) {
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-ink/60 shrink-0 text-sm font-bold whitespace-nowrap">{label}</p>
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto">
        {options.map((option) => {
          const value = String(option)
          const active = selected.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? 'bg-ink text-parchment border-ink'
                  : 'border-ink/30 bg-cream text-ink hover:bg-parchment'
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
    <div className="border-ink/20 bg-cream flex flex-col gap-3 rounded-2xl border-2 border-dashed p-3">
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
