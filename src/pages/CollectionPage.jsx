import { useParams } from 'react-router'
import animals from '../data/animals.json'
import characters from '../data/characters.json'
import crops from '../data/crops.json'
import festivals from '../data/festivals.json'
import fishes from '../data/fishes.json'
import insects from '../data/insects.json'
import minerals from '../data/minerals.json'
import recipes from '../data/recipes.json'
import villages from '../data/villages.json'
import { CollectionEntryList } from '../components/CollectionEntryList.jsx'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'

const DATA_BY_COLLECTION = {
  characters,
  crops,
  animals,
  recipes,
  fishes,
  insects,
  minerals,
  festivals,
  villages,
}

function CollectionPage() {
  const { collection } = useParams()
  const entries = DATA_BY_COLLECTION[collection] ?? []
  const config = COLLECTION_CONFIGS[collection]

  return (
    <div>
      <h1 className="text-lg font-bold">{config?.label ?? collection}</h1>
      {config ? (
        <div className="mt-3">
          <CollectionEntryList config={config} entries={entries} />
        </div>
      ) : (
        <p className="text-ink/60 mt-3 text-sm">此分類的顯示設定尚未建立。</p>
      )}
    </div>
  )
}

export default CollectionPage
