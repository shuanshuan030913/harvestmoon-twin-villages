import { useParams } from 'react-router'
import { findEntry } from '../data/collectionsIndex.js'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'
import { formatColumnValue } from '../utils/formatColumnValue.js'
import { ItemChips } from '../components/ItemChips.jsx'

// 村莊印章章的短字（DESIGN.md §印章章）
const SEAL_TEXT = {
  藍鈴村: ['藍', '鈴'],
  此花村: ['此', '花'],
  雙村共通: ['共', '通'],
}

// 生日寫成遊戲內曆法（春の月N日），當拍立得上的手寫日期
function formatBirthdayJp(birthday) {
  const m = /^(春|夏|秋|冬)-(\d+)$/.exec(birthday ?? '')
  return m ? `${m[1]}の月${m[2]}日` : birthday
}

function VillageSeal({ village }) {
  const chars = SEAL_TEXT[village]
  if (!chars) return null
  return (
    <span className="seal font-hand text-[13px] font-bold" title={village}>
      <span>
        {chars[0]}
        <br />
        {chars[1]}
      </span>
    </span>
  )
}

function EntryPage() {
  const { collection, slug } = useParams()
  const entry = findEntry(collection, slug)
  const config = COLLECTION_CONFIGS[collection]

  if (!entry) {
    return <p className="text-ink/60 mt-3 text-sm">找不到條目（{collection}/{slug}）。</p>
  }

  const title = entry.name ?? entry.title
  const hasSeal = Boolean(SEAL_TEXT[entry.village])
  // 有頭像時日文名寫在拍立得說明，不重複掛在標題旁
  const showJpTitle = entry.name_jp && entry.name_jp !== title && !entry.portrait
  // 村莊已由印章章表達、生日已寫在拍立得手寫日期，資訊列不重複列
  const columns = (config?.columns ?? []).filter(
    (column) =>
      !(column.key === 'village' && hasSeal) &&
      !(column.key === 'birthday' && entry.portrait),
  )

  return (
    <article data-village={entry.village}>
      {/* 明細與下方內文同寬（2026-07-17 使用者回饋：左右間距要一致） */}
      <div>
        {entry.portrait ? (
          <figure className="polaroid mx-auto mt-4 w-[172px]">
            <img src={entry.portrait} alt={`${title}頭像`} className="block w-full" />
            {entry.name_jp || entry.birthday ? (
              <figcaption className="font-hand text-ink/70 mt-1.5 flex items-baseline justify-center gap-2 text-xs">
                {entry.name_jp ? <span className="tracking-widest">{entry.name_jp}</span> : null}
                {entry.birthday ? (
                  <span className="text-ink/55">{formatBirthdayJp(entry.birthday)}</span>
                ) : null}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="mt-5 flex items-center justify-center gap-3.5">
          <h1 className="font-hand text-3xl font-bold tracking-wide">
            {title}
            {showJpTitle ? (
              <span className="text-ink/50 ml-1 text-base font-normal">（{entry.name_jp}）</span>
            ) : null}
          </h1>
          <VillageSeal village={entry.village} />
        </div>

        {columns.length > 0 ? (
          <dl className="mt-4 text-sm">
            {columns.map((column) => {
              const linkedItems = entry[`${column.key}Links`]
              return (
                <div
                  key={column.key}
                  className="border-ink/40 flex justify-between gap-3 border-b-[1.5px] border-dotted px-0.5 py-2"
                >
                  <dt className="text-ink/60 shrink-0">{column.label}</dt>
                  <dd className="text-right">
                    {linkedItems ? (
                      <ItemChips items={linkedItems} variant={column.key === 'loves' ? 'love' : undefined} />
                    ) : (
                      formatColumnValue(entry[column.key], column)
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
        ) : null}

        {entry.lovesLinks ? (
          <section className="mt-4">
            <h2 className="font-hand text-sm font-bold">最愛</h2>
            <div className="mt-1.5">
              <ItemChips items={entry.lovesLinks} align="start" variant="love" />
            </div>
          </section>
        ) : null}

        {entry.likesLinks ? (
          <section className="mt-4">
            <h2 className="font-hand text-sm font-bold">喜歡</h2>
            <div className="mt-1.5">
              <ItemChips items={entry.likesLinks} align="start" />
            </div>
          </section>
        ) : null}

        {entry.hates?.length ? (
          <section className="mt-4">
            <h2 className="font-hand text-sm font-bold">討厭</h2>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {entry.hates.map((item) => (
                <li key={item} className="chip-torn text-ink/55 px-2 py-0.5 text-xs line-through">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {entry.loathesLinks ? (
          <section className="mt-4">
            <h2 className="font-hand text-sm font-bold">最討厭</h2>
            <div className="mt-1.5">
              <ItemChips items={entry.loathesLinks} align="start" variant="loathe" />
            </div>
          </section>
        ) : null}
      </div>

      {entry.html ? (
        <div
          className="prose prose-sm mt-5 max-w-none"
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
