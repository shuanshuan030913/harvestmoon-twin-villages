export const COLLECTION_CONFIGS = {
  characters: {
    columns: [
      { key: 'village', label: '村莊' },
      { key: 'birthday', label: '生日' },
      { key: 'occupation', label: '職業' },
    ],
    filters: [
      { key: 'village', label: '村莊' },
      { key: 'marriageable', label: '可攻略' },
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
      { key: 'season', label: '季節' },
      { key: 'village', label: '村莊' },
      { key: 'regrowable', label: '可重複收成' },
    ],
    sorts: [
      { key: 'sell_price', label: '賣價' },
      { key: 'grow_days', label: '成長天數' },
    ],
  },
}
