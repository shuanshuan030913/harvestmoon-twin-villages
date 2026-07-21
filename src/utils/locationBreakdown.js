// 「依地點查詢」頁的解析工具（U33，2026-07-21）：insects/fishes 的 location 欄位是
// 自由文字（C4/C16 刻意設計，人類可讀優先於為少數例外套陣列 schema），但格式高度規律，
// 已用全部 85/64 筆真實資料驗證過下列規則零失敗（3 筆昆蟲原文本身即不確定地點除外）。

export const FISH_LOCATIONS = ['淺灘（左1）', '淺灘（右6）', '池', '河川', '瀑布下游', '瀑布下']

export const INSECT_LOCATIONS = ['地區1', '地區2', '地區3', '地區4', '地區5', '地區6']

const SEASON_CHARS = ['春', '夏', '秋', '冬']

// 最長匹配優先，避免「瀑布下」誤吃「瀑布下游」的前綴
const FISH_LOCATIONS_BY_LENGTH = [...FISH_LOCATIONS].sort((a, b) => b.length - a.length)

function splitFishLocationText(text) {
  const locations = []
  let rest = text
  while (rest.length > 0) {
    const match = FISH_LOCATIONS_BY_LENGTH.find((loc) => rest.startsWith(loc))
    if (!match) break
    locations.push(match)
    rest = rest.slice(match.length)
    if (rest.startsWith('、')) rest = rest.slice(1)
  }
  return locations
}

// 魚類 location：以「；」分段，每段「地點[、地點]*[：季節[、季節]*[，備註]?]?」，
// 無冒號＝該段適用整個 entry 的 season 欄。
export function parseFishLocation(entry) {
  return entry.location.split('；').map((segment) => {
    const match = /^(.+?)：(.+)$/.exec(segment)
    const locationText = match ? match[1] : segment
    const locations = splitFishLocationText(locationText)

    if (!match) {
      return { locations, seasons: entry.season, note: null }
    }
    const rest = match[2]
    const seasons = SEASON_CHARS.filter((char) => rest.includes(char))
    const noteMatch = /，(.+)$/.exec(rest)
    return { locations, seasons, note: noteMatch ? noteMatch[1] : null }
  })
}

// 昆蟲 location：以「；」分段，每段「[季節[、季節]*：]地區[0-9、]+」，無冒號＝該段
// 適用整個 entry 的 season 欄。少數原文本身就寫「似乎全區」「地區全」這種不確定用語
// （bugs 攻略也承認「攻略作者自己也不確定實際範圍」）——不猜測拆成具體地區代碼，
// 標記 uncertain: true，交由查詢頁的「地點不確定」分類處理，不遺漏、不虛構。
export function parseInsectLocation(entry) {
  return entry.location.split('；').map((segment) => {
    const match = /^([春夏秋冬、]+)：(.+)$/.exec(segment)
    const seasons = match ? match[1].split('、') : entry.season
    const locationText = match ? match[2] : segment

    const codes = locationText.replace('地區', '').split('、')
    const allNumeric = codes.length > 0 && codes.every((code) => /^[1-6]$/.test(code))
    if (!allNumeric) {
      return { locations: [], seasons, uncertain: true, raw: locationText }
    }
    return { locations: codes.map((code) => `地區${code}`), seasons, uncertain: false }
  })
}

// 走訪 entries，依 parseFn 解析結果把每個 entry 依「(地點, 該地點適用季節)」歸戶。
// uncertain 分段（僅昆蟲）另外歸進 UNCERTAIN_KEY，不歸進任何具體地點。
export const UNCERTAIN_KEY = '__uncertain__'

export function buildLocationIndex(entries, parseFn) {
  const index = new Map()

  function addTo(key, item) {
    if (!index.has(key)) index.set(key, [])
    index.get(key).push(item)
  }

  for (const entry of entries) {
    for (const segment of parseFn(entry)) {
      if (segment.uncertain) {
        addTo(UNCERTAIN_KEY, { entry, seasons: segment.seasons, raw: segment.raw })
        continue
      }
      for (const location of segment.locations) {
        addTo(location, { entry, seasons: segment.seasons, note: segment.note ?? null })
      }
    }
  }
  return index
}
