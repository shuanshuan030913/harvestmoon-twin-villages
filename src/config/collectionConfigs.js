import animals from '../data/animals.json'
import festivals from '../data/festivals.json'

const VILLAGE_OPTIONS = ['藍鈴村', '此花村', '雙村共通']
const SEASON_OPTIONS = ['春', '夏', '秋', '冬']
const RECIPE_CATEGORY_OPTIONS = ['主食', '沙拉湯', '甜點', '其他', '拼盤']

function uniqueOptions(entries, key) {
  return [...new Set(entries.map((entry) => entry[key]).filter(Boolean))].sort()
}

export const COLLECTION_CONFIGS = {
  characters: {
    columns: [
      { key: 'village', label: '村莊' },
      { key: 'birthday', label: '生日' },
      { key: 'occupation', label: '職業' },
      { key: 'loves', label: '最愛' },
    ],
    filters: [
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
      { key: 'marriageable', label: '可攻略', options: [true, false] },
    ],
    sorts: [{ key: 'name', label: '名稱' }],
  },
  crops: {
    columns: [
      { key: 'season', label: '季節' },
      { key: 'village', label: '村莊' },
      { key: 'sell_price', label: '賣價' },
      { key: 'grow_days', label: '成長天數' },
    ],
    filters: [
      { key: 'season', label: '季節', options: SEASON_OPTIONS },
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
      { key: 'regrowable', label: '可重複收成', options: [true, false] },
    ],
    sorts: [
      { key: 'sell_price', label: '賣價' },
      { key: 'grow_days', label: '成長天數' },
    ],
  },
  animals: {
    columns: [
      { key: 'species', label: '種類' },
      { key: 'village', label: '村莊' },
      { key: 'buy_price', label: '購入價' },
      { key: 'product', label: '產物' },
    ],
    filters: [
      { key: 'species', label: '種類', options: uniqueOptions(animals, 'species') },
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
    ],
    sorts: [{ key: 'buy_price', label: '購入價' }],
  },
  festivals: {
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
    sorts: [{ key: 'day', label: '日期' }],
  },
  recipes: {
    columns: [
      { key: 'category', label: '分類' },
      { key: 'cookware', label: '廚具' },
      { key: 'sell_price_5star', label: '5★ 賣價' },
    ],
    filters: [{ key: 'category', label: '分類', options: RECIPE_CATEGORY_OPTIONS }],
    sorts: [{ key: 'sell_price_5star', label: '5★ 賣價' }],
  },
  fishes: {
    columns: [
      { key: 'season', label: '季節' },
      { key: 'location', label: '地點' },
      { key: 'time', label: '時段' },
      { key: 'sell_price', label: '賣價' },
    ],
    filters: [{ key: 'season', label: '季節', options: SEASON_OPTIONS }],
    sorts: [{ key: 'sell_price', label: '賣價' }],
  },
}
