import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../content')
const OUTPUT_DIR = path.resolve(__dirname, '../src/data')

// 資料夾 → collection 對照，見 .spec/modules/content-pipeline.md
const COLLECTION_DIRS = {
  characters: 'characters',
  'cooking/recipes': 'recipes',
  'farming/crops': 'crops',
  'fishing/fishes': 'fishes',
  'fishing/items': 'items',
  'bugs/insects': 'insects',
  'livestock/animals': 'animals',
  'mining/minerals': 'minerals',
  'life/festivals': 'festivals',
  villages: 'villages',
}

function readMarkdownDir(dirPath) {
  if (!fs.existsSync(dirPath)) return []
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '')
      const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8')
      const { data } = matter(raw)
      return { slug, ...data }
    })
}

export function buildCollections() {
  const collections = {}
  for (const [relDir, collectionName] of Object.entries(COLLECTION_DIRS)) {
    collections[collectionName] = readMarkdownDir(path.join(CONTENT_DIR, relDir))
  }
  return collections
}

function writeCollection(name, entries) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.json`), `${JSON.stringify(entries, null, 2)}\n`)
}

function main() {
  const collections = buildCollections()
  writeCollection('crops', collections.crops)
  console.log(`crops.json 產出 ${collections.crops.length} 筆`)
}

main()
