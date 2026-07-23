import animals from '../data/animals.json'
import festivals from '../data/festivals.json'
import pets from '../data/pets.json'
import recipes from '../data/recipes.json'

const VILLAGE_OPTIONS = ['藍鈴村', '此花村', '雙村共通']
const SEASON_OPTIONS = ['春', '夏', '秋', '冬']
const TIME_OPTIONS = ['早晨', '白天', '傍晚', '夜晚']
// 沙拉（サラダ）與湯（スープ）在遊戲內是獨立分類，「沙拉類與湯類食譜」只是同一篇 guide
const RECIPE_CATEGORY_OPTIONS = ['主食', '沙拉', '湯', '拼盤', '甜點', '其他']

function uniqueOptions(entries, key) {
  return [...new Set(entries.map((entry) => entry[key]).filter(Boolean))].sort()
}

// 列表排序用的分組順序（U42/U51，2026-07-22）：animals/pets 沒有像 VILLAGE_OPTIONS
// 那樣人工排定的既定順序，直接沿用篩選器已經在用的 uniqueOptions（字母序），
// 只要求「同種類相鄰」，組間先後順序不是重點。
const ANIMAL_SPECIES_ORDER = uniqueOptions(animals, 'species')
const PET_SPECIES_ORDER = uniqueOptions(pets, 'species')

export const COLLECTION_CONFIGS = {
  characters: {
    label: '角色',
    columns: [
      { key: 'village', label: '村莊' },
      { key: 'birthday', label: '生日' },
    ],
    // 條目頁限定的角色卡欄（列表卡不顯示），順序依原始出處角色卡（2026-07-19 使用者裁決）。
    // debut/residence 待 content 補欄位（todo C11）後自動長出；缺值列不渲染。
    detailColumns: [
      { key: 'debut', label: '登場條件' },
      { key: 'residence', label: '居住地點' },
      { key: 'family', label: '家庭關係' },
      { key: 'liked_outfit', label: '喜歡的服裝' },
      { key: 'date_days', label: '約會時段' },
      { key: 'likes_date', label: '喜歡的約會地點' },
      { key: 'neutral_date', label: '一般的約會地點' },
      { key: 'hates_date', label: '討厭的約會地點' },
    ],
    filters: [
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
      { key: 'marriageable', label: '可攻略', options: [true, false] },
    ],
    // 依村莊分組（U46，2026-07-22 使用者裁決）：生日曆序需求已被 CalendarPage 滿足，
    // 列表頁改村莊分組跟行事曆頁功能互補；組內依生日曆序升冪（2026-07-22 使用者追加：
    // 主排序村莊、副排序生日）。
    sort: { groupBy: 'village', groupOrder: VILLAGE_OPTIONS, secondaryBy: 'birthday_calendar' },
  },
  crops: {
    label: '作物',
    columns: [
      { key: 'season', label: '季節' },
      { key: 'village', label: '村莊' },
      { key: 'sell_price', label: '賣價（5★）', unit: 'G' },
      { key: 'grow_days', label: '成長天數' },
    ],
    // 條目頁限定欄（U19d／U23，2026-07-20）：原本只在內文樣板 bullet 出現，
    // C14 補齊 water_times／seed_shop 欄後移入這裡，剝除內文重複句
    detailColumns: [
      { key: 'buy_price', label: '購入價', unit: 'G' },
      { key: 'water_times', label: '澆水次數' },
      { key: 'seed_shop', label: '購買地點' },
      { key: 'regrowable', label: '可重複收成' },
      { key: 'regrow_days', label: '再生間隔' },
    ],
    filters: [
      { key: 'season', label: '季節', options: SEASON_OPTIONS },
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
      { key: 'regrowable', label: '可重複收成', options: [true, false] },
    ],
    // 依季節分組、組內生長天數（取下限）升冪（U45，2026-07-22）
    sort: { groupBy: 'season', groupOrder: SEASON_OPTIONS, secondaryBy: 'grow_days_min' },
  },
  animals: {
    label: '動物',
    // U36（2026-07-22）：buy_price 是帶條件說明的長字串（如「1500 / 3000（小牛／
    // 成牛，成牛為此花村限定販售）」），列表卡换行時若後面還有欄位，會讓同一排
    // 卡片的後續欄位跟鄰卡錯開對不齊；buy_price 排最後，換行只影響卡片自己的
    // 底部高度，不拖累其他欄位。
    columns: [
      { key: 'species', label: '種類' },
      { key: 'village', label: '村莊' },
      { key: 'product', label: '產物' },
      { key: 'buy_price', label: '購入價', unit: 'G' },
    ],
    filters: [
      { key: 'species', label: '種類', options: ANIMAL_SPECIES_ORDER },
      { key: 'village', label: '村莊', options: VILLAGE_OPTIONS },
    ],
    // 依種類分組（同種類相鄰，如牛/茶牛、羊/黑羊），組內購入價升冪——buy_price
    // 是複合字串（如「1500 / 3000（小牛／成牛...）」），leading 取第一個數字
    // （基礎品種價格）當權重（U42，2026-07-22）
    sort: { groupBy: 'species', groupOrder: ANIMAL_SPECIES_ORDER, secondaryBy: 'buy_price_leading' },
  },
  // 寵物拆為獨立 collection（U26/C21，2026-07-21）：不設產物欄（寵物無副產品，
  // 語意由 collection 歸屬本身承載，不需要欄位或散文佔位表達）
  pets: {
    label: '寵物',
    columns: [
      { key: 'species', label: '種類' },
      { key: 'village', label: '村莊' },
      { key: 'buy_price', label: '購入價', unit: 'G' },
    ],
    filters: [{ key: 'species', label: '種類', options: PET_SPECIES_ORDER }],
    // 依種類分組（U51，2026-07-22 使用者裁決：僅 5 筆仍要處理，不因筆數少而例外）；
    // 組內次序本輪未討論，維持穩定排序。
    sort: { groupBy: 'species', groupOrder: PET_SPECIES_ORDER },
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
    // 依 day 升冪，null（料理大會、花之日，全季節皆有）排最前——當作「常態/整季
    // 有效」優先看到（U43，2026-07-22 使用者裁決）
    sort: { secondaryBy: 'day_asc_null_first' },
  },
  recipes: {
    label: '料理',
    // 列表縮為名稱＋5★賣價一行卡（U28，2026-07-20）：分類/廚具全權交給篩選器承擔，
    // 明細頁靠 detailColumns 補回（分類仍連 guideHref，廚具改用篩選器同款動態選項）。
    columns: [{ key: 'sell_price_5star', label: '5★ 賣價', unit: 'G' }],
    // 總覽模式開關（U56，2026-07-23）：玩家想一次掃過整批料理找食材，靠篩選器
    // 縮回的欄位（食材/廚具）在總覽模式下額外顯示在卡片裡，不新增查詢邏輯。
    overview: true,
    detailColumns: [
      { key: 'category', label: '分類' },
      { key: 'cookware', label: '廚具' },
    ],
    filters: [
      { key: 'category', label: '分類', options: RECIPE_CATEGORY_OPTIONS },
      { key: 'cookware', label: '廚具', options: uniqueOptions(recipes, 'cookware') },
    ],
    // 依分類分組（順序沿用既有 RECIPE_CATEGORY_OPTIONS，不另訂新序），
    // 組內 5★ 賣價升冪（U44，2026-07-22）
    sort: { groupBy: 'category', groupOrder: RECIPE_CATEGORY_OPTIONS, secondaryBy: 'sell_price_5star' },
  },
  fishes: {
    label: '魚類',
    columns: [
      { key: 'season', label: '季節' },
      { key: 'location', label: '地點' },
      // 「時段」欄移除（U29，2026-07-20）：64 篇資料全數無 time 欄位（C4 條目化時
      // 來源缺未填），欄位留在 config 只會永遠空白，不是明細也不需保留
      { key: 'condition', label: '條件' },
      // 「5★」承接開頭句被剝除的品質語意（U19a，不可默默丟失）
      { key: 'sell_price', label: '賣價（5★）', unit: 'G' },
    ],
    filters: [{ key: 'season', label: '季節', options: SEASON_OPTIONS }],
    // 「依地點查詢」頁入口（U33，2026-07-21）：通用欄位，未來其他 collection
    // 若也想要類似查詢頁可比照加，不需改 CollectionPage.jsx 邏輯
    lookupHref: '#/lookup/fishes',
    // 依季節分組、組內賣價升冪（U47，2026-07-22）
    sort: { groupBy: 'season', groupOrder: SEASON_OPTIONS, secondaryBy: 'sell_price' },
  },
  insects: {
    label: '昆蟲',
    columns: [
      { key: 'season', label: '季節' },
      { key: 'location', label: '地點' },
      { key: 'time', label: '時段' },
      { key: 'sell_price', label: '賣價', unit: 'G' },
    ],
    // 條目頁限定欄（C16，2026-07-20）：原開頭句「，昆蟲顏色為X」子句剝除前先補欄，
    // 80/85 篇有值（5 篇青蛙來源無此資料，缺值不渲染，不是佔位）
    detailColumns: [{ key: 'color', label: '顏色' }],
    lookupHref: '#/lookup/insects',
    filters: [
      { key: 'season', label: '季節', options: SEASON_OPTIONS },
      // 「今晚能抓什麼」場景（U29，2026-07-20）；applyFilters 對陣列欄本就是
      // 「包含」比對（entryValue.includes(candidate)），不需額外改比對邏輯
      { key: 'time', label: '時段', options: TIME_OPTIONS },
    ],
    // 依季節分組、組內賣價升冪，邏輯同 fishes（U48，2026-07-22）
    sort: { groupBy: 'season', groupOrder: SEASON_OPTIONS, secondaryBy: 'sell_price' },
  },
  minerals: {
    label: '礦物',
    columns: [
      // 「賣價」標星度語意（U29，2026-07-20，與 19 篇星度賣價表首格核對確認
      // sell_price＝☆0.5 最低星價，方向與 crops 5★/fishes 5★ 相反，避免誤讀）
      { key: 'sell_price', label: '賣價（☆0.5）', unit: 'G' },
      { key: 'use', label: '用途' },
    ],
    // 「地點」欄移出列表（19 筆全同值「礦山隧道（雙村共通）」零鑑別度），
    // 明細頁仍顯示（U29，2026-07-20）
    detailColumns: [{ key: 'location', label: '地點' }],
    filters: [],
    // 無分類型欄位可分組，依賣價升冪（U49，2026-07-22）
    sort: { secondaryBy: 'sell_price' },
  },
  villages: {
    label: '村莊',
    columns: [
      { key: 'style', label: '風格' },
      { key: 'mayor', label: '村長' },
      // 內文「## 商店」段的清單 bullet 原本是它唯一顯示處（U19f，2026-07-19 補欄）
      { key: 'shops', label: '商店' },
    ],
    filters: [],
  },
  items: {
    label: '物品',
    columns: [
      { key: 'season', label: '季節' },
      { key: 'location', label: '地點' },
      { key: 'condition', label: '條件' },
      // 花束/香水等加工品有商店購買價，原本只在內文（U19c，2026-07-19 補欄）
      { key: 'buy_price', label: '購入價', unit: 'G' },
      { key: 'sell_price', label: '賣價', unit: 'G' },
      { key: 'use', label: '用途' },
    ],
    filters: [{ key: 'season', label: '季節', options: SEASON_OPTIONS }],
  },
}
