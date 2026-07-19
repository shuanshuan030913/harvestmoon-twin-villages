import { useEffect } from 'react'

// index.html 的預設 <title>；hash router 換頁不會重新載入 index.html，
// 各頁需自行同步分頁標題（T8.4）。
const SITE_TITLE = '牧場物語 雙子村 攻略網站'

// title 為 falsy（如首頁、找不到條目）時維持站名本身，不接空字串。
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title}｜${SITE_TITLE}` : SITE_TITLE
  }, [title])
}
