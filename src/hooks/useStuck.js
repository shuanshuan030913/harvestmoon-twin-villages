import { useEffect, useRef, useState } from 'react'

// sticky 元素是否「真的黏住」（捲動經過、擠壓到自己該貼的那條線），而非只要
// sticky 元素存在就顯示陰影/邊界（U65，2026-07-24：使用者回饋陰影不該在頁面
// 最上方、尚未觸發 sticky 時就出現）。做法：在 sticky 元素前放一個 0 高度
// sentinel，用 IntersectionObserver 觀察它是否捲出 `rootMargin` 頂部內縮
// `offsetPx`（即 sticky 元素 `top` 值）的那條線——sentinel 不再與視窗相交，
// 代表 sticky 元素已經貼住。回傳 `[sentinelRef, stuck]`，sentinelRef 掛在
// sticky 元素前一個 0 高度節點上。
export function useStuck(offsetPx) {
  const sentinelRef = useRef(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: `-${offsetPx}px 0px 0px 0px`,
      threshold: 0,
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [offsetPx])

  return [sentinelRef, stuck]
}
