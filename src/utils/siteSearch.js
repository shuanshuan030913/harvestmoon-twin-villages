import { searchEntries } from './search.js'

export const SEARCH_FIELDS = {
  characters: ['name', 'name_jp', 'loves', 'likes'],
  crops: ['name', 'name_jp'],
  animals: ['name', 'name_jp'],
  pets: ['name', 'name_jp'],
  recipes: ['name', 'name_jp'],
  fishes: ['name', 'name_jp'],
  insects: ['name', 'name_jp'],
  minerals: ['name', 'name_jp'],
  festivals: ['name', 'name_jp'],
  villages: ['name', 'title'],
  // guides 本期只索引標題；plain 全文搜尋（需 snippet 呈現）拆開另掛任務（U18）
  guides: ['title'],
}

export function searchAllCollections(collections, query) {
  const results = {}
  for (const [name, fields] of Object.entries(SEARCH_FIELDS)) {
    const entries = collections[name] ?? []
    const matches = searchEntries(entries, query, fields)
    if (matches.length > 0) results[name] = matches
  }
  return results
}
