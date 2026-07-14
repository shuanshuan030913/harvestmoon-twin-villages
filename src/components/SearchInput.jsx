import { useEffect, useRef, useState } from 'react'

// IME 安全的搜尋輸入框：中文（注音/拼音）組字期間只更新本地狀態，
// 組字結束（compositionend）才呼叫 onChange 同步到 URL——若每個键擊都
// setSearchParams，router 重渲染會打斷組字，導致無法正常輸入中文。
export function SearchInput({ value, onChange, placeholder, className }) {
  const [text, setText] = useState(value)
  const composingRef = useRef(false)

  // 外部值變動（返回/前進、清除篩選）時回灌；組字中不干擾
  useEffect(() => {
    if (!composingRef.current) setText(value)
  }, [value])

  return (
    <input
      type="search"
      value={text}
      placeholder={placeholder}
      className={className}
      onChange={(event) => {
        setText(event.target.value)
        if (!composingRef.current) onChange(event.target.value)
      }}
      onCompositionStart={() => {
        composingRef.current = true
      }}
      onCompositionEnd={(event) => {
        composingRef.current = false
        onChange(event.target.value)
      }}
    />
  )
}
