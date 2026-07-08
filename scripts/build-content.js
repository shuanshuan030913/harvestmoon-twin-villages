import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { marked } from 'marked'

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
      const html = marked.parse(content)
      const plain = htmlToPlainText(html)
      return { slug, ...data, html, plain }
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

function main() {
  const collections = buildCollections()
  for (const [name, entries] of Object.entries(collections)) {
    writeCollection(name, entries)
    console.log(`${name}.json 產出 ${entries.length} 筆`)
  }
}

main()
