import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { marked } from 'marked'
import { buildWikilinkTable, resolveWikilinks } from './wikilinks.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../content')
const OUTPUT_DIR = path.resolve(__dirname, '../src/data')

// collection → 來源資料夾（可多個），見 .spec/modules/content-pipeline.md
const COLLECTION_DIRS = {
  characters: ['characters'],
  recipes: ['cooking/recipes'],
  crops: ['farming/crops'],
  fishes: ['fishing/fishes'],
  items: ['fishing/items'],
  insects: ['bugs/insects'],
  animals: ['livestock/animals'],
  minerals: ['mining/minerals'],
  festivals: ['life/festivals'],
  villages: ['villages'],
  guides: [
    'cooking/guide',
    'farming/guide',
    'fishing/guide',
    'bugs/guide',
    'livestock/guide',
    'mining/guide',
    'life/guide',
    'romance/guide',
    'basics',
  ],
}

function htmlToPlainText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readMarkdownDir(dirPath) {
  if (!fs.existsSync(dirPath)) return []
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '')
      const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8')
      const { data, content } = matter(raw)
      return { slug, ...data, content }
    })
}

export function buildCollections() {
  const collections = {}
  for (const [collectionName, relDirs] of Object.entries(COLLECTION_DIRS)) {
    collections[collectionName] = relDirs.flatMap((relDir) =>
      readMarkdownDir(path.join(CONTENT_DIR, relDir)),
    )
  }
  return collections
}

function writeCollection(name, entries) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.json`), `${JSON.stringify(entries, null, 2)}\n`)
}

function computeHref(collectionName, entry) {
  if (collectionName === 'guides') return `#/guide/${entry.system}/${entry.slug}`
  return `#/c/${collectionName}/${entry.slug}`
}

function main() {
  const collections = buildCollections()

  const lookupEntries = Object.entries(collections).flatMap(([name, entries]) =>
    entries.map((entry) => ({
      slug: entry.slug,
      name: entry.name,
      title: entry.title,
      href: computeHref(name, entry),
    })),
  )
  const { table, warnings } = buildWikilinkTable(lookupEntries)

  for (const [name, entries] of Object.entries(collections)) {
    for (const entry of entries) {
      // wikilink 必須在 marked 轉換「前」解析：[[target|alias]] 的 `|`
      // 若留到 html 階段才處理，會被 marked 誤判為 markdown 表格的欄位分隔符。
      const resolvedMarkdown = resolveWikilinks(
        entry.content,
        table,
        warnings,
        `${name}/${entry.slug}`,
      )
      entry.html = marked.parse(resolvedMarkdown)
      entry.plain = htmlToPlainText(entry.html)
      delete entry.content
    }
    writeCollection(name, entries)
    console.log(`${name}.json 產出 ${entries.length} 筆`)
  }

  if (warnings.length > 0) {
    console.log(`\n共 ${warnings.length} 則警告：`)
    for (const warning of warnings) console.log(`  - ${warning}`)
  }
}

main()
