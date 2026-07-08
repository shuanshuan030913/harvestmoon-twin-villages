import characters from '../data/characters.json'
import crops from '../data/crops.json'
import { CollectionEntryList } from '../components/CollectionEntryList.jsx'
import { COLLECTION_CONFIGS } from '../config/collectionConfigs.js'

function CollectionConfigDemoPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="font-bold">characters</h2>
        <CollectionEntryList config={COLLECTION_CONFIGS.characters} entries={characters.slice(0, 2)} />
      </section>
      <section>
        <h2 className="font-bold">crops</h2>
        <CollectionEntryList config={COLLECTION_CONFIGS.crops} entries={crops.slice(0, 2)} />
      </section>
    </div>
  )
}

export default CollectionConfigDemoPage
