import { useSearchParams } from 'react-router'
import { parseMultiParam } from '../utils/collectionQuery.js'

function formatOptionLabel(value) {
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <div>
      <p className="text-ink/60 text-xs font-bold">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const value = String(option)
          const active = selected.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
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

  function updateSort(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('sort', value)
    else next.delete('sort')
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
      <div className="flex items-center justify-between gap-2">
        {config.sorts?.length > 0 ? (
          <select
            value={searchParams.get('sort') ?? ''}
            onChange={(event) => updateSort(event.target.value)}
            className="border-ink/30 bg-cream rounded-full border px-2 py-1 text-xs"
          >
            <option value="">排序</option>
            {config.sorts.map((sort) => (
              <option key={sort.key} value={sort.key}>
                {sort.label}
              </option>
            ))}
          </select>
        ) : (
          <span />
        )}
        {hasSelection ? (
          <button type="button" onClick={clearAll} className="text-ink/60 text-xs underline">
            清除篩選
          </button>
        ) : null}
      </div>
    </div>
  )
}
