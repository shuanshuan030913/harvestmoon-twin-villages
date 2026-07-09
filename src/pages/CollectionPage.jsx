import { useParams, useSearchParams } from 'react-router'
import { DATA_BY_COLLECTION } from '../data/collectionsIndex.js'
import { CollectionEntryList } from '../components/CollectionEntryList.jsx'
import { FilterBar } from '../components/FilterBar.jsx'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'
import { applyFilters, applySort } from '../utils/collectionQuery.js'

function CollectionPage() {
  const { collection } = useParams()
  const [searchParams] = useSearchParams()
  const entries = DATA_BY_COLLECTION[collection] ?? []
  const config = COLLECTION_CONFIGS[collection]

  const filters = Object.fromEntries(
    (config?.filters ?? []).map((filter) => [filter.key, searchParams.get(filter.key) ?? '']),
  )
  const filtered = applyFilters(entries, filters)
  const sorted = applySort(filtered, searchParams.get('sort') ?? '')

  return (
    <div>
      <h1 className="text-lg font-bold">{config?.label ?? collection}</h1>
      {config ? (
        <>
          <div className="mt-3">
            <FilterBar config={config} />
          </div>
          <div className="mt-3">
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
