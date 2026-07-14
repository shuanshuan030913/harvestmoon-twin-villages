// 條目呈現層轉換：資料查證註記剝除、角色頭像抽取。
// content/ 檔案本身不動（那是編輯者的查證紀錄），只影響 build 產物。

// 內容查證/編輯用註記的 blockquote 標籤字彙：`> **命名說明**：…`、`> **資料修正…**`
// 等只服務內容維護者，開發期不呈現在條目明細頁（2026-07-14 使用者裁決）。
const EDITORIAL_LABEL = /^>\s*\*\*(關於|[^*]*(說明|修正|沿革|狀態|矛盾))[^*]*\*\*/

export function stripEditorialNotes(markdown) {
  const lines = markdown.split('\n')
  const kept = []
  let skipping = false

  for (const line of lines) {
    if (EDITORIAL_LABEL.test(line)) {
      skipping = true
      continue
    }
    if (skipping) {
      // blockquote 連續行（含 `>` 空行）皆屬同一註記
      if (/^>/.test(line.trim()) || line.trim() === '') {
        if (line.trim() === '') skipping = false
        continue
      }
      skipping = false
    }
    kept.push(line)
  }
  return kept.join('\n')
}

// 角色條目的第一張「alt 以角色名開頭」的圖片視為頭像（路線時間來源的首圖慣例）。
export function extractPortrait(markdown, name, basePath) {
  if (!name) return undefined
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  for (const match of markdown.matchAll(imagePattern)) {
    const [, alt, path] = match
    if (alt.startsWith(name)) {
      return path.replace(/^(\.\.\/)+images\//, `${basePath}images/`)
    }
  }
  return undefined
}
