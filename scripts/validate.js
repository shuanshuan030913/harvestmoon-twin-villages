import { parseGrowDays } from '../src/utils/growDays.js'

// 各 collection 必填欄位，見 .spec/modules/content-pipeline.md
export const REQUIRED_FIELDS = {
  characters: [
    'title',
    'name',
    'name_jp',
    'village',
    'birthday',
    'marriageable',
    'gender',
    'occupation',
    'loves',
    'likes',
  ],
  crops: ['name', 'name_jp', 'season', 'village', 'buy_price', 'sell_price', 'grow_days', 'regrowable'],
  animals: ['name', 'name_jp', 'species', 'village', 'buy_price', 'product', 'product_value'],
  recipes: ['name', 'name_jp'],
  fishes: ['name', 'name_jp'],
  items: ['name', 'name_jp'],
  insects: ['name', 'name_jp'],
  minerals: ['name', 'name_jp'],
  festivals: ['name', 'name_jp', 'season', 'day'],
  villages: ['title'],
  guides: ['title', 'created', 'tags', 'source', 'system'],
}

export function validateRequiredFields(collectionName, entry, sourceLabel) {
  const requiredFields = REQUIRED_FIELDS[collectionName] ?? []
  const warnings = []
  for (const field of requiredFields) {
    if (entry[field] === undefined) {
      warnings.push(`${sourceLabel}：缺少必填欄位「${field}」`)
    }
  }
  return warnings
}

export function validateGrowDays(entry, sourceLabel) {
  if (entry.grow_days === undefined) return []
  if (parseGrowDays(entry.grow_days) === null) {
    return [`${sourceLabel}：grow_days 格式不合法「${entry.grow_days}」`]
  }
  return []
}

export function validateTreatRequirements(entry, sourceLabel) {
  if (entry.treat_requirements === undefined) return []

  const warnings = []
  for (const [treatType, thresholds] of Object.entries(entry.treat_requirements)) {
    if (thresholds === null) continue
    const isValid =
      Array.isArray(thresholds) &&
      thresholds.length === 4 &&
      thresholds.every((value) => value === null || typeof value === 'number')
    if (!isValid) {
      warnings.push(`${sourceLabel}：treat_requirements.${treatType} 結構不合法`)
    }
  }
  return warnings
}

export function findDuplicateSlugs(allEntries) {
  const seen = new Set()
  const duplicates = new Set()
  for (const entry of allEntries) {
    if (seen.has(entry.slug)) duplicates.add(entry.slug)
    seen.add(entry.slug)
  }
  return [...duplicates]
}
