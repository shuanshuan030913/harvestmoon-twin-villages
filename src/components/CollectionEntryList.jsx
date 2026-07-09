import { EntryCard } from './EntryCard.jsx'

export function CollectionEntryList({ config, entries, collection }) {
  if (entries.length === 0) {
    return <p className="text-ink/60 mt-3 text-sm">此分類目前尚無條目。</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <EntryCard key={entry.slug} entry={entry} config={config} collection={collection} />
      ))}
    </ul>
  )
}
