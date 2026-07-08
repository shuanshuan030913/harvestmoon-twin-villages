import fs from 'node:fs'

// 順序重要：`../../images/` 內含 `../images/` 子字串，須先換長的，
// 否則短版會先吃掉長版的尾段，留下換不掉的殘留 `../`。
export function rewriteImagePaths(content, basePath) {
  return content
    .replaceAll('../../images/', `${basePath}images/`)
    .replaceAll('../images/', `${basePath}images/`)
}

export function copyContentImages(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return
  fs.rmSync(destDir, { recursive: true, force: true })
  fs.cpSync(srcDir, destDir, { recursive: true })
}
