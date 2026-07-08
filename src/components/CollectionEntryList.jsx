import { formatColumnValue } from '../utils/formatColumnValue.js'

export function CollectionEntryList({ config, entries }) {
  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li key={entry.slug} className="bg-cream border-ink/20 rounded-2xl border p-3">
          <p className="font-bold">{entry.name ?? entry.title}</p>
          <dl className="divide-ink/20 mt-1 divide-y divide-dashed text-sm">
            {config.columns.map((column) => (
              <div key={column.key} className="flex justify-between py-1">
                <dt className="text-ink/60">{column.label}</dt>
                <dd>{formatColumnValue(entry[column.key])}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  )
}
