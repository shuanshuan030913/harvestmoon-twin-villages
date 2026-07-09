import { useParams } from 'react-router'
import { findEntry } from '../data/collectionsIndex.js'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'
import { formatColumnValue } from '../utils/formatColumnValue.js'
import { ItemChips } from '../components/ItemChips.jsx'

function EntryPage() {
  const { collection, slug } = useParams()
  const entry = findEntry(collection, slug)
  const config = COLLECTION_CONFIGS[collection]

  if (!entry) {
    return <p className="text-ink/60 mt-3 text-sm">找不到條目（{collection}/{slug}）。</p>
  }

  const title = entry.name ?? entry.title
  const showJpTitle = entry.name_jp && entry.name_jp !== title

  return (
    <article data-village={entry.village}>
      <h1 className="text-(--village) text-xl font-bold">
        {title}
        {showJpTitle ? <span className="text-ink/50 ml-1 text-base">（{entry.name_jp}）</span> : null}
      </h1>

      {config ? (
        <dl className="divide-ink/20 border-(--village) bg-cream mt-3 divide-y divide-dashed rounded-2xl border-2 p-3 text-sm">
          {config.columns.map((column) => {
            const linkedItems = entry[`${column.key}Links`]
            return (
              <div key={column.key} className="flex justify-between gap-3 py-1">
                <dt className="text-ink/60 shrink-0">{column.label}</dt>
                <dd className="text-right">
                  {linkedItems ? <ItemChips items={linkedItems} /> : formatColumnValue(entry[column.key])}
                </dd>
              </div>
            )
          })}
        </dl>
      ) : null}

      {entry.likesLinks ? (
        <section className="mt-3">
          <h2 className="text-ink/60 text-xs font-bold">喜歡</h2>
          <div className="mt-1">
            <ItemChips items={entry.likesLinks} align="start" />
          </div>
        </section>
      ) : null}

      {entry.html ? (
        <div
          className="prose prose-sm mt-4 max-w-none"
          dangerouslySetInnerHTML={{ __html: entry.html }}
        />
      ) : null}

      {entry.source ? (
        <p className="text-ink/50 mt-4 text-xs">
          原始出處：
          <a href={entry.source} target="_blank" rel="noreferrer" className="underline">
            {entry.source}
          </a>
        </p>
      ) : null}
    </article>
  )
}

export default EntryPage
