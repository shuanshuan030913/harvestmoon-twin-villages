import { useParams } from 'react-router'
import guides from '../data/guides.json'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

function GuidePage() {
  const { system, slug } = useParams()
  const entry = guides.find((guide) => guide.system === system && guide.slug === slug)
  // 早退回傳前先呼叫（Hooks 規則：不可依 entry 是否存在而條件式呼叫）
  useDocumentTitle(entry?.displayTitle ?? entry?.title)

  if (!entry) {
    return <p className="text-ink/60 mt-3 text-sm">找不到攻略（{system}/{slug}）。</p>
  }

  return (
    <article>
      {/* 固定的目錄入口，與全域「← 回上一頁」（瀏覽器歷史）語意不同——深連結直開仍可用（U18） */}
      <a href="#/guides" className="text-ink/60 hover:underline text-sm">
        ← 攻略總覽
      </a>
      <h1 className="font-hand text-ink mt-2 text-2xl font-bold">{entry.displayTitle ?? entry.title}</h1>

      {entry.html ? (
        <div
          className="prose [&_table]:block [&_table]:overflow-x-auto [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap mt-4 max-w-none"
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
