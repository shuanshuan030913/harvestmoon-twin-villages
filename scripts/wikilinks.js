export function buildWikilinkTable(entries) {
  const keyGroups = new Map()

  function addKey(key, entry) {
    if (!key) return
    if (!keyGroups.has(key)) keyGroups.set(key, new Set())
    keyGroups.get(key).add(entry)
  }

  for (const entry of entries) {
    addKey(entry.name, entry)
    addKey(entry.title, entry)
    addKey(entry.slug, entry)
  }

  const table = new Map()
  const warnings = []

  for (const [key, entrySet] of keyGroups) {
    const uniqueEntries = [...entrySet]
    if (uniqueEntries.length > 1) {
      warnings.push(`wikilink 對照表撞名：「${key}」指向 ${uniqueEntries.length} 個條目，該鍵作廢`)
      continue
    }
    table.set(key, uniqueEntries[0])
  }

  return { table, warnings }
}

// U22（2026-07-22）：部分 wikilink 語意上指向整個 collection 列表頁（如「[[作物]]」）
// 而非單一條目，條目鍵建不出來；額外註冊這批別名，條目鍵優先、不覆蓋既有鍵。
export function addCollectionAliases(table, aliases) {
  for (const [alias, href] of Object.entries(aliases)) {
    if (table.has(alias)) continue
    table.set(alias, { href })
  }
}

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

export function resolveWikilinks(html, table, warnings, sourceLabel) {
  return html.replace(WIKILINK_RE, (match, target, alias) => {
    const entry = table.get(target)
    const display = alias ?? target
    if (!entry) {
      warnings.push(`wikilink 查無目標「${target}」（來源：${sourceLabel}）`)
      return display
    }
    return `<a href="${entry.href}">${display}</a>`
  })
}
