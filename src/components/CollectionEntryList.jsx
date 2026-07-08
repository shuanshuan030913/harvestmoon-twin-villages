import { EntryCard } from './EntryCard.jsx'

export function CollectionEntryList({ config, entries }) {
  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <EntryCard key={entry.slug} entry={entry} config={config} />
      ))}
    </ul>
  )
}
