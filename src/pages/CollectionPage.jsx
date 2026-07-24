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
import { Icon } from '../components/icons.jsx'

function CollectionPage() {
  const { collection } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const entries = DATA_BY_COLLECTION[collection] ?? []
  const config = COLLECTION_CONFIGS[collection]
  useDocumentTitle(config?.label)

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
          {/* 搜尋框＋篩選切換鈕＋展開的篩選面板 sticky 置頂（U64，2026-07-23
              使用者回饋：長列表往下捲動找項目時，想調整篩選條件得先捲回最頂端）。
              top 扣掉全域 header 實際高度（108px，Playwright 量測），z-index 比
              header 的 z-10 低，避免蓋過或被蓋過；bg-cream 蓋住捲動經過的列表
              內容，不然會透出來。收尾原本用 border-b-2 border-dashed，跟正上方
              全域 header 自己的虛線貼太近，變成兩條虛線疊在一起很雜亂（使用者
              回饋「線多到很醜」，出 artifact 對過方向）；改用極淡陰影表達
              「這塊浮在內容上面」，不再畫邊框線。 */}
          <div className="bg-cream sticky top-[108px] z-[5] pt-3 pb-2 shadow-[0_4px_6px_-4px_rgba(74,55,40,0.18)]">
            <div className="flex items-center gap-2">
              <label className="border-ink/45 focus-within:border-ink flex min-w-0 flex-1 items-center gap-2 border-b-2 border-dashed px-1 focus-within:border-solid">
                <Icon id="search" className="text-ink/50 h-4 w-4 shrink-0" />
                <SearchInput
                  value={query}
                  onChange={updateQuery}
                  placeholder="輸入名稱搜尋…"
                  className="placeholder:text-ink/50 w-full bg-transparent py-2 text-sm focus:outline-none"
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
