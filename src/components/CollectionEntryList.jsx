import { EntryCard } from './EntryCard.jsx'

function CharacterCard({ entry }) {
  return (
    <li data-village={entry.village} className="h-full">
      <a
        href={`#/c/characters/${entry.slug}`}
        className="bg-(--village)/10 flex h-full flex-col items-center gap-1 rounded-2xl p-2 text-center"
      >
        {entry.portrait ? (
          <img
            src={entry.portrait}
            alt={entry.name}
            loading="lazy"
            className="border-ink/10 aspect-square w-full rounded-xl border object-cover object-top"
          />
        ) : (
          <span className="bg-parchment text-ink/40 flex aspect-square w-full items-center justify-center rounded-xl text-3xl font-bold">
            {(entry.name ?? '?').charAt(0)}
          </span>
        )}
        <span className="text-(--village) text-sm font-bold">{entry.name}</span>
        <span className="text-ink/60 text-sm">
          {entry.village}
          {entry.birthday ? ` · ${entry.birthday}` : ''}
        </span>
      </a>
    </li>
  )
}

export function CollectionEntryList({ config, entries, collection }) {
  if (entries.length === 0) {
    return <p className="text-ink/60 mt-3 text-sm">查無符合的條目。</p>
  }

  if (collection === 'characters') {
    return (
      <ul className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6">
        {entries.map((entry) => (
          <CharacterCard key={entry.slug} entry={entry} />
        ))}
      </ul>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => (
        <EntryCard key={entry.slug} entry={entry} config={config} collection={collection} />
      ))}
    </ul>
  )
}
