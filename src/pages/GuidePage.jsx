import { useParams } from 'react-router'
import guides from '../data/guides.json'
import { Icon } from '../components/icons.jsx'
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

      {/* guide 讀完只有排行/機制說明，完整清單在條目 collection——反向連回篩選頁
          （U57②，2026-07-23；正向的「分類值連到本篇 guide」見 EntryPage.jsx guideHref） */}
      {entry.collectionHref ? (
        <a
          href={entry.collectionHref}
          className="border-ink/50 bg-soil/15 mt-4 flex items-center gap-2 rounded-lg border-[1.5px] border-dashed px-3 py-2 text-sm"
        >
          <Icon id="pot" className="h-4 w-4 shrink-0" />
          <span className="font-hand font-bold">查看完整清單</span>
          <span className="text-ink/50 ml-auto">→</span>
        </a>
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
