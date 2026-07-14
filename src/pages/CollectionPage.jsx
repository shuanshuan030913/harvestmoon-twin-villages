import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { DATA_BY_COLLECTION } from '../data/collectionsIndex.js'
import { CollectionEntryList } from '../components/CollectionEntryList.jsx'
import { FilterBar } from '../components/FilterBar.jsx'
import { SearchInput } from '../components/SearchInput.jsx'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'
import { applyFilters, applySort, parseMultiParam } from '../utils/collectionQuery.js'
import { searchEntries } from '../utils/search.js'

function CollectionPage() {
  const { collection } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const entries = DATA_BY_COLLECTION[collection] ?? []
  const config = COLLECTION_CONFIGS[collection]

  const query = searchParams.get('q') ?? ''
  const filters = Object.fromEntries(
    (config?.filters ?? []).map((filter) => [filter.key, parseMultiParam(searchParams.get(filter.key))]),
  )
  const activeFilterCount = Object.values(filters).reduce((sum, values) => sum + values.length, 0)
  const [filtersOpen, setFiltersOpen] = useState(activeFilterCount > 0)

  const searched = query.trim() ? searchEntries(entries, query, ['name', 'name_jp', 'title']) : entries
  const filtered = applyFilters(searched, filters)
  const sorted = applySort(filtered, searchParams.get('sort') ?? '')

  function updateQuery(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <h1 className="text-lg font-bold">{config?.label ?? collection}</h1>
      {config ? (
        <>
          <div className="mt-3 flex items-center gap-2">
            <SearchInput
              value={query}
              onChange={updateQuery}
              placeholder="輸入名稱搜尋…"
              className="border-ink/30 bg-cream min-w-0 flex-1 rounded-full border px-4 py-1.5 text-sm"
            />
            {config.filters.length > 0 ? (
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  filtersOpen || activeFilterCount > 0
                    ? 'bg-ink text-parchment border-ink'
                    : 'border-ink/30 bg-cream text-ink'
                }`}
              >
                篩選{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''} {filtersOpen ? '▲' : '▼'}
              </button>
            ) : null}
          </div>
          {filtersOpen && config.filters.length > 0 ? (
            <div className="mt-2">
              <FilterBar config={config} />
            </div>
          ) : null}
          <p className="text-ink/50 mt-2 text-xs">{sorted.length} 筆</p>
          <div className="mt-2">
            <CollectionEntryList config={config} entries={sorted} collection={collection} />
          </div>
        </>
      ) : (
        <p className="text-ink/60 mt-3 text-sm">此分類的顯示設定尚未建立。</p>
      )}
    </div>
  )
}

export default CollectionPage
