const VILLAGE_OPTIONS = ['藍鈴村', '此花村', '雙村共通']

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
      { key: 'season', label: '季節', options: ['春', '夏', '秋', '冬'] },
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
      { key: 'regrowable', label: '可重複收成', options: [true, false] },
    ],
    sorts: [
      { key: 'sell_price', label: '賣價' },
      { key: 'grow_days', label: '成長天數' },
    ],
  },
}
