import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { DATA_BY_COLLECTION } from '../data/collectionsIndex.js'
import { CollectionEntryList } from '../components/CollectionEntryList.jsx'
import { FilterBar } from '../components/FilterBar.jsx'
import { SearchInput } from '../components/SearchInput.jsx'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'
import { applyFilters, parseMultiParam, sortEntries } from '../utils/collectionQuery.js'
import { searchEntries } from '../utils/search.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useStuck } from '../hooks/useStuck.js'
import { useHeaderHeight } from '../hooks/useHeaderHeight.js'
import { Icon } from '../components/icons.jsx'

function CollectionPage() {
  const { collection } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const entries = DATA_BY_COLLECTION[collection] ?? []
  const config = COLLECTION_CONFIGS[collection]
  useDocumentTitle(config?.label)
  // 篩選列陰影改「真的黏頂」才顯示，不再只要有篩選列就一律顯示（U65，
  // 2026-07-24）；top 偏移改讀 Layout.jsx 動態量測的 header 實際高度，取代原本
  // 寫死的 108（U68：header 樣式一改高度就對不齊，兩個 sticky 貼合基準點錯開
  // 而出現縫隙）。
  const headerHeight = useHeaderHeight()
  const [filterBarSentinelRef, filterBarStuck] = useStuck(headerHeight)

  const query = searchParams.get('q') ?? ''
  const filters = Object.fromEntries(
    (config?.filters ?? []).map((filter) => [filter.key, parseMultiParam(searchParams.get(filter.key))]),
  )
  const activeFilterCount = Object.values(filters).reduce((sum, values) => sum + values.length, 0)
  const [filtersOpen, setFiltersOpen] = useState(activeFilterCount > 0)

  const searched = query.trim() ? searchEntries(entries, query, ['name', 'name_jp', 'title']) : entries
  const filtered = sortEntries(applyFilters(searched, filters), config?.sort)

  function updateQuery(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <h1 className="font-hand text-xl font-bold">{config?.label ?? collection}</h1>
      {config ? (
        <>
          {config.note ? <p className="text-ink/60 mt-1 text-sm">{config.note}</p> : null}
          {/* 搜尋框＋篩選切換鈕＋展開的篩選面板 sticky 置頂（U64，2026-07-23
              使用者回饋：長列表往下捲動找項目時，想調整篩選條件得先捲回最頂端）。
              top 扣掉全域 header 實際高度（Layout.jsx 用 ResizeObserver 動態量測，
              見 useHeaderHeight——U68 修正原本寫死 108px 與 header 實際高度不同步
              造成的縫隙），z-index 比 header 的 z-10 低，避免蓋過或被蓋過；
              bg-cream 蓋住捲動經過的列表內容，不然會透出來。陰影改「真的黏頂」
              才顯示，不是只要有篩選列就一律顯示（U65，2026-07-24：使用者回饋
              同一小塊畫面疊了 header 虛線／搜尋框虛線／本項陰影三條線，靜止
              狀態不該有陰影）；搜尋框從虛線底線改成跟「篩選」鈕同款的填色圓角
              pill，拿掉自己的線。 */}
          <div ref={filterBarSentinelRef} />
          <div
            style={{ top: headerHeight }}
            className={`bg-cream sticky z-[5] pt-3 pb-2 transition-shadow ${
              filterBarStuck ? 'shadow-[0_4px_6px_-4px_rgba(74,55,40,0.18)]' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <label className="bg-ink/8 focus-within:bg-ink/15 flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-1.5">
                <Icon id="search" className="text-ink/50 h-4 w-4 shrink-0" />
                <SearchInput
                  value={query}
                  onChange={updateQuery}
                  placeholder="輸入名稱搜尋…"
                  className="placeholder:text-ink/50 w-full bg-transparent text-sm focus:outline-none"
                />
              </label>
              {config.filters.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors md:min-h-0 ${
                    filtersOpen || activeFilterCount > 0
                      ? 'bg-ink text-parchment'
                      : 'bg-ink/8 text-ink hover:bg-ink/15'
                  }`}
                >
                  <span>篩選{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}</span>
                  <Icon id="chevron" className={`h-3.5 w-3.5 shrink-0 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : null}
            </div>
            {filtersOpen && config.filters.length > 0 ? (
              <div className="mt-2 pb-1">
                <FilterBar config={config} />
              </div>
            ) : null}
          </div>
          {config.lookupHref ? (
            <a
              href={config.lookupHref}
              className="border-ink/50 bg-soil/15 mt-2 flex items-center gap-2 rounded-lg border-[1.5px] border-dashed px-3 py-2 text-sm"
            >
              <Icon id="pin" className="h-4 w-4 shrink-0" />
              <span className="font-hand font-bold">依地點查詢</span>
              <span className="text-ink/50 ml-auto">→</span>
            </a>
          ) : null}
          <p className="text-ink/50 mt-2 text-xs">{filtered.length} 筆</p>
          <div className="mt-2">
            <CollectionEntryList config={config} entries={filtered} collection={collection} />
          </div>
        </>
      ) : (
        <p className="text-ink/60 mt-3 text-sm">此分類的顯示設定尚未建立。</p>
      )}
    </div>
  )
}

export default CollectionPage
