import { describe, expect, it } from 'vitest'
import { rewriteImagePaths } from './images.js'

const BASE = '/harvestmoon-twin-villages/'

describe('rewriteImagePaths', () => {
  it('rewrites ../images/ to the base path', () => {
    expect(rewriteImagePaths('![alt](../images/foo/bar.jpg)', BASE)).toBe(
      '![alt](/harvestmoon-twin-villages/images/foo/bar.jpg)',
    )
  })

  it('rewrites ../../images/ to the base path without leftover ../', () => {
    expect(rewriteImagePaths('![alt](../../images/foo/bar.jpg)', BASE)).toBe(
      '![alt](/harvestmoon-twin-villages/images/foo/bar.jpg)',
    )
  })

  it('leaves an <!-- img: url --> fallback comment untouched', () => {
    const content = '<!-- img: http://pic.pimg.tw/leomoon173/abc.jpg -->'
    expect(rewriteImagePaths(content, BASE)).toBe(content)
  })

  it('rewrites multiple occurrences in the same document', () => {
    const content = '![a](../images/a.jpg) and ![b](../../images/b.jpg)'
    expect(rewriteImagePaths(content, BASE)).toBe(
      '![a](/harvestmoon-twin-villages/images/a.jpg) and ![b](/harvestmoon-twin-villages/images/b.jpg)',
    )
  })
})
