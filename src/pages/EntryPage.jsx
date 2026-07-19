import { useParams } from 'react-router'
import { findEntry } from '../data/collectionsIndex.js'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'
import { formatColumnValue } from '../utils/formatColumnValue.js'
import { ItemChips } from '../components/ItemChips.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

// 送禮名單（U27，2026-07-20）：characters 喜好連結反向歸戶，四級皆顯示——
// 「討厭」同正面名單一樣是防呆用的關鍵資訊（別送誰），與 loves/likes/loathes chips 同語言
const GIFT_FAN_LEVELS = [
  { key: 'loves', label: '最愛', variant: 'love' },
  { key: 'likes', label: '喜歡', variant: undefined },
  { key: 'hates', label: '討厭', variant: 'hate' },
  { key: 'loathes', label: '最討厭', variant: 'loathe' },
]

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
  // 早退回傳前先呼叫（Hooks 規則：不可依 entry 是否存在而條件式呼叫）
  useDocumentTitle(entry?.name ?? entry?.title)

  if (!entry) {
    return <p className="text-ink/60 mt-3 text-sm">找不到條目（{collection}/{slug}）。</p>
  }

  const title = entry.name ?? entry.title
  const hasSeal = Boolean(SEAL_TEXT[entry.village])
  // 有頭像時日文名寫在拍立得說明，不重複掛在標題旁
  const showJpTitle = entry.name_jp && entry.name_jp !== title && !entry.portrait
  // 村莊已由印章章表達、生日已寫在拍立得手寫日期，資訊列不重複列；
  // detailColumns 為條目頁限定欄（如角色卡的約會欄），缺值（來源沒有）整列不渲染；
  // 一律用多值變體（label 一行、值換行）排版，與同群組其他限定欄視覺一致
  // （2026-07-19 使用者裁決：不論單值/多值都上下排，避免只有喜歡的服裝左右並排）
  const columns = [
    ...(config?.columns ?? []),
    ...(config?.detailColumns ?? []).map((column) => ({ ...column, stacked: true })),
  ].filter(
    (column) =>
      !(column.key === 'village' && hasSeal) &&
      !(column.key === 'birthday' && entry.portrait) &&
      entry[column.key] != null &&
      !(Array.isArray(entry[column.key]) && entry[column.key].length === 0),
  )

  return (
    <article data-village={entry.village}>
      {/* 明細與下方內文同寬（2026-07-17 使用者回饋：左右間距要一致） */}
      <div>
        {entry.portrait ? (
          /* 272px＝DS 截圖原生 254px＋相紙邊 8px×2＋框線，像素 1:1 最清晰（2026-07-19 使用者回饋） */
          <figure className="polaroid mx-auto mt-4 w-[272px] max-w-full">
            <img src={entry.portrait} alt={`${title}頭像`} className="block w-full" />
            {entry.name_jp || entry.birthday ? (
              <figcaption className="font-hand text-ink/70 mt-1.5 flex items-baseline justify-center gap-2 text-sm">
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
              const value = entry[column.key]

              // family：每項帶稱謂前綴（母親／父親…），走資訊列多值變體但
              // 用自訂渲染取代 ItemChips（chips 無法附掛前綴文字，2026-07-19 C11）
              if (column.key === 'family') {
                return (
                  <div
                    key={column.key}
                    className="border-ink/40 border-b-[1.5px] border-dotted px-0.5 py-2"
                  >
                    <dt className="text-ink/60">{column.label}</dt>
                    <dd className="mt-0.5 space-y-0.5">
                      {entry.familyLinks.map((item, i) => (
                        <div key={i}>
                          <span className="text-ink/60">{item.relation}：</span>
                          {item.href ? (
                            <a
                              href={item.href}
                              className="underline decoration-dotted underline-offset-2"
                            >
                              {item.zh}
                              {item.jp ? `（${item.jp}）` : ''}
                            </a>
                          ) : (
                            <span>
                              {item.zh}
                              {item.jp ? `（${item.jp}）` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </dd>
                  </div>
                )
              }

              // 多值欄（約會地點/時段等）右對齊折行難讀，改 label 一行、值換行左對齊
              // 的資訊列變體（2026-07-19 使用者裁決，DESIGN.md §資訊列）；
              // detailColumns 一律套用（column.stacked），與同群組視覺一致
              if (!linkedItems && (column.stacked || Array.isArray(value))) {
                return (
                  <div
                    key={column.key}
                    className="border-ink/40 border-b-[1.5px] border-dotted px-0.5 py-2"
                  >
                    <dt className="text-ink/60">{column.label}</dt>
                    <dd className="mt-0.5">{formatColumnValue(value, column)}</dd>
                  </div>
                )
              }
              return (
                <div
                  key={column.key}
                  className="border-ink/40 flex justify-between gap-3 border-b-[1.5px] border-dotted px-0.5 py-2"
                >
                  <dt className="text-ink/60 shrink-0">{column.label}</dt>
                  <dd className="text-right">
                    {linkedItems ? (
                      <ItemChips items={linkedItems} variant={column.key === 'loves' ? 'love' : undefined} />
                    ) : column.key === 'category' && entry.guideHref ? (
                      // 分類值連到該分類的總覽 guide（取代舊內文「相關」段落的功能）
                      <a href={entry.guideHref} className="underline decoration-dotted underline-offset-2">
                        {formatColumnValue(value, column)}
                      </a>
                    ) : (
                      formatColumnValue(value, column)
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
        ) : null}

        {entry.ingredientsLinks ? (
          <section className="mt-4">
            <h2 className="font-hand text-sm font-bold">食材</h2>
            <div className="mt-1.5">
              <ItemChips items={entry.ingredientsLinks} align="start" />
            </div>
          </section>
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

        {entry.hatesLinks ? (
          <section className="mt-4">
            <h2 className="font-hand text-sm font-bold">討厭</h2>
            <div className="mt-1.5">
              <ItemChips items={entry.hatesLinks} align="start" variant="hate" />
            </div>
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

        {entry.giftFans ? (
          <section className="mt-4">
            <h2 className="font-hand text-sm font-bold">送禮名單</h2>
            <div className="mt-1.5 flex flex-col gap-2.5">
              {GIFT_FAN_LEVELS.map(({ key, label, variant }) =>
                entry.giftFans[key] ? (
                  <div key={key}>
                    <h3 className="text-ink/60 text-xs">{label}</h3>
                    <div className="mt-1">
                      <ItemChips items={entry.giftFans[key]} align="start" variant={variant} />
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          </section>
        ) : null}
      </div>

      {entry.html ? (
        /* 條目頁內文列表去圓點、改手帳虛線行（與資訊列同語言，2026-07-19 使用者裁決）；
           手帳行字級對齊資訊列 14px（同日使用者裁決，僅 li，連續閱讀段落不動）；
           guide 長文不套用。內文圖（DS 截圖）不放大超過原生尺寸；表格（戀愛事件段落，
           C12 從 guide 移入角色頁後首次出現）比照 GuidePage 的 overflow 護欄，頁面本體不橫捲 */
        <div
          className="prose mt-5 max-w-none [&_li]:border-ink/40 [&_ul]:list-none [&_ul]:pl-0 [&_li]:my-0 [&_li]:border-b-[1.5px] [&_li]:border-dotted [&_li]:py-1 [&_li]:pl-0.5 [&_li]:text-sm [&_img]:max-w-[255px] [&_table]:block [&_table]:overflow-x-auto [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
          dangerouslySetInnerHTML={{ __html: entry.html }}
        />
      ) : null}

      {/* 內文「## 來源」段整併到頁尾弱化出處列（2026-07-19 使用者裁決），支援多來源 */}
      {entry.sources?.length ? (
        <ul className="text-ink/50 mt-4 space-y-0.5 text-xs">
          {entry.sources.map((source) => (
            <li key={source.url}>
              出處：
              <a href={source.url} target="_blank" rel="noreferrer" className="underline">
                {source.title}
              </a>
              {source.retrieved ? `（擷取於 ${source.retrieved}）` : null}
            </li>
          ))}
        </ul>
      ) : entry.source ? (
        <p className="text-ink/50 mt-4 text-xs">
          出處：
          <a href={entry.source} target="_blank" rel="noreferrer" className="underline">
            {entry.source}
          </a>
          {entry.retrieved ? `（擷取於 ${entry.retrieved}）` : null}
        </p>
      ) : null}
    </article>
  )
}

export default EntryPage
