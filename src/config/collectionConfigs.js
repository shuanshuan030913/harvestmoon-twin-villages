import animals from '../data/animals.json'
import festivals from '../data/festivals.json'

const VILLAGE_OPTIONS = ['藍鈴村', '此花村', '雙村共通']
const SEASON_OPTIONS = ['春', '夏', '秋', '冬']
// 沙拉（サラダ）與湯（スープ）在遊戲內是獨立分類，「沙拉類與湯類食譜」只是同一篇 guide
const RECIPE_CATEGORY_OPTIONS = ['主食', '沙拉', '湯', '拼盤', '甜點', '其他']

function uniqueOptions(entries, key) {
  return [...new Set(entries.map((entry) => entry[key]).filter(Boolean))].sort()
}

export const COLLECTION_CONFIGS = {
  characters: {
    label: '角色',
    columns: [
      { key: 'village', label: '村莊' },
      { key: 'birthday', label: '生日' },
    ],
    filters: [
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
      { key: 'marriageable', label: '可攻略', options: [true, false] },
    ],
  },
  crops: {
    label: '作物',
    columns: [
      { key: 'season', label: '季節' },
      { key: 'village', label: '村莊' },
      { key: 'sell_price', label: '賣價', unit: 'G' },
      { key: 'grow_days', label: '成長天數' },
    ],
    filters: [
      { key: 'season', label: '季節', options: SEASON_OPTIONS },
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
      { key: 'regrowable', label: '可重複收成', options: [true, false] },
    ],
  },
  animals: {
    label: '動物',
    columns: [
      { key: 'species', label: '種類' },
      { key: 'village', label: '村莊' },
      { key: 'buy_price', label: '購入價', unit: 'G' },
      { key: 'product', label: '產物' },
    ],
    filters: [
      { key: 'species', label: '種類', options: uniqueOptions(animals, 'species') },
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
    ],
  },
  festivals: {
    label: '節慶',
    columns: [
      { key: 'season', label: '季節' },
      { key: 'day', label: '日期' },
      { key: 'location', label: '地點' },
      { key: 'type', label: '類型' },
    ],
    filters: [
      { key: 'season', label: '季節', options: SEASON_OPTIONS },
      { key: 'type', label: '類型', options: uniqueOptions(festivals, 'type') },
    ],
  },
  recipes: {
    label: '料理',
    columns: [
      { key: 'category', label: '分類' },
      { key: 'cookware', label: '廚具' },
      { key: 'sell_price_5star', label: '5★ 賣價', unit: 'G' },
    ],
    filters: [{ key: 'category', label: '分類', options: RECIPE_CATEGORY_OPTIONS }],
  },
  fishes: {
    label: '魚類',
    columns: [
      { key: 'season', label: '季節' },
      { key: 'location', label: '地點' },
      { key: 'time', label: '時段' },
      { key: 'sell_price', label: '賣價', unit: 'G' },
    ],
    filters: [{ key: 'season', label: '季節', options: SEASON_OPTIONS }],
  },
  insects: {
    label: '昆蟲',
    columns: [
      { key: 'season', label: '季節' },
      { key: 'location', label: '地點' },
      { key: 'time', label: '時段' },
      { key: 'sell_price', label: '賣價', unit: 'G' },
    ],
    filters: [{ key: 'season', label: '季節', options: SEASON_OPTIONS }],
  },
  minerals: {
    label: '礦物',
    columns: [
      { key: 'location', label: '地點' },
      { key: 'sell_price', label: '賣價', unit: 'G' },
      { key: 'use', label: '用途' },
    ],
    filters: [],
  },
  villages: {
    label: '村莊',
    columns: [
      { key: 'style', label: '風格' },
      { key: 'mayor', label: '村長' },
    ],
    filters: [],
  },
  items: {
    label: '物品',
    columns: [
      { key: 'season', label: '季節' },
      { key: 'location', label: '地點' },
      { key: 'condition', label: '條件' },
      { key: 'sell_price', label: '賣價', unit: 'G' },
      { key: 'use', label: '用途' },
    ],
    filters: [{ key: 'season', label: '季節', options: SEASON_OPTIONS }],
  },
}
