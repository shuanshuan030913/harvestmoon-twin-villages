import { useParams } from 'react-router'
import guides from '../data/guides.json'

function GuidePage() {
  const { system, slug } = useParams()
  const entry = guides.find((guide) => guide.system === system && guide.slug === slug)

  if (!entry) {
    return <p className="text-ink/60 mt-3 text-sm">找不到攻略（{system}/{slug}）。</p>
  }

  return (
    <article>
      <h1 className="text-ink text-xl font-bold">{entry.title}</h1>

      {entry.html ? (
        <div
          className="prose prose-sm [&_table]:block [&_table]:overflow-x-auto [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap mt-4 max-w-none"
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

export default GuidePage
