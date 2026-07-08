import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// 遞迴列出目錄下所有檔案的相對路徑，排序固定（供 hash 輸入穩定）。
function listFilesSorted(dir, rootDir = dir) {
  if (!fs.existsSync(dir)) return []
  const results = []
  for (const name of fs.readdirSync(dir).sort()) {
    const fullPath = path.join(dir, name)
    if (fs.statSync(fullPath).isDirectory()) {
      results.push(...listFilesSorted(fullPath, rootDir))
    } else {
      results.push(path.relative(rootDir, fullPath))
    }
  }
  return results
}

export function computeContentHash(contentDir) {
  const hash = crypto.createHash('sha256')
  for (const relPath of listFilesSorted(contentDir)) {
    hash.update(relPath)
    hash.update(fs.readFileSync(path.join(contentDir, relPath)))
  }
  return hash.digest('hex')
}

const WARNING_CATEGORIES = [
  ['wikilink 對照表撞名', (w) => w.startsWith('wikilink 對照表撞名')],
  ['wikilink 查無目標', (w) => w.startsWith('wikilink 查無目標')],
  ['物品索引查無', (w) => w.startsWith('物品索引查無')],
  ['缺少必填欄位', (w) => w.includes('缺少必填欄位')],
  ['grow_days 格式不合法', (w) => w.includes('grow_days 格式不合法')],
  ['treat_requirements 結構不合法', (w) => w.includes('treat_requirements') && w.includes('結構不合法')],
]

export function categorizeWarning(warning) {
  const found = WARNING_CATEGORIES.find(([, test]) => test(warning))
  return found ? found[0] : '其他'
}

export function summarizeWarnings(warnings) {
  const summary = new Map()
  for (const warning of warnings) {
    const category = categorizeWarning(warning)
    summary.set(category, (summary.get(category) ?? 0) + 1)
  }
  return summary
}

export function buildManifest({ collections, warnings, contentHash, builtAt }) {
  const counts = {}
  for (const [name, entries] of Object.entries(collections)) {
    counts[name] = entries.length
  }
  return { builtAt, contentHash, counts, warnings }
}
