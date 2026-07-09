import animals from './animals.json'
import characters from './characters.json'
import crops from './crops.json'
import festivals from './festivals.json'
import fishes from './fishes.json'
import insects from './insects.json'
import items from './items.json'
import minerals from './minerals.json'
import recipes from './recipes.json'
import villages from './villages.json'

export const DATA_BY_COLLECTION = {
  characters,
  crops,
  animals,
  recipes,
  fishes,
  insects,
  minerals,
  festivals,
  villages,
  items,
}

export function findEntry(collection, slug) {
  const entries = DATA_BY_COLLECTION[collection]
  if (!entries) return undefined
  return entries.find((entry) => entry.slug === slug)
}
