import { createContext, useContext } from 'react'

// Layout.jsx 用 ResizeObserver 量出全域 header 的實際高度往下傳，取代頁面內
// 寫死的像素數字（U68，2026-07-24：U65 拿掉 header 邊框後高度變了，但下游
// CollectionPage.jsx 寫死的 108 沒跟著更新，兩個 sticky 元素貼合基準點對不
// 齊而出現縫隙）。任何頁面要接在全域 header 下方 sticky，讀這個 context 取
// 代自行量測或寫死數字。
export const HeaderHeightContext = createContext(0)

export function useHeaderHeight() {
  return useContext(HeaderHeightContext)
}
