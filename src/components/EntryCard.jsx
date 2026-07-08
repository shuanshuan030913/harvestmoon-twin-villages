import { formatColumnValue } from '../utils/formatColumnValue.js'

export function EntryCard({ entry, config }) {
  return (
    <li
      data-village={entry.village}
      className="bg-cream border-(--village) rounded-2xl border-2 p-3"
    >
      <p className="text-(--village) font-bold">{entry.name ?? entry.title}</p>
      <dl className="divide-ink/20 mt-1 divide-y divide-dashed text-sm">
        {config.columns.map((column) => (
          <div key={column.key} className="flex justify-between gap-3 py-1">
            <dt className="text-ink/60 shrink-0">{column.label}</dt>
            <dd className="text-right">{formatColumnValue(entry[column.key])}</dd>
          </div>
        ))}
      </dl>
    </li>
  )
}
