import { useSearchParams } from 'react-router'

function formatOptionLabel(value) {
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

export function FilterBar({ config }) {
  const [searchParams, setSearchParams] = useSearchParams()

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {config.filters.map((filter) => (
        <select
          key={filter.key}
          value={searchParams.get(filter.key) ?? ''}
          onChange={(event) => updateParam(filter.key, event.target.value)}
          className="border-ink/30 bg-cream rounded-full border px-2 py-1 text-xs"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {formatOptionLabel(option)}
            </option>
          ))}
        </select>
      ))}
      {config.sorts?.length > 0 && (
        <select
          value={searchParams.get('sort') ?? ''}
          onChange={(event) => updateParam('sort', event.target.value)}
          className="border-ink/30 bg-cream rounded-full border px-2 py-1 text-xs"
        >
          <option value="">排序</option>
          {config.sorts.map((sort) => (
            <option key={sort.key} value={sort.key}>
              {sort.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
