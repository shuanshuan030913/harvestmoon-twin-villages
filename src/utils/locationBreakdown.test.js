import { describe, expect, it } from 'vitest'
import {
  UNCERTAIN_KEY,
  buildLocationIndex,
  parseFishLocation,
  parseInsectLocation,
} from './locationBreakdown.js'

describe('parseFishLocation', () => {
  it('handles a plain multi-location entry with no colon (applies to the whole season array)', () => {
    const entry = { location: '池、瀑布下游', season: ['夏'] }
    expect(parseFishLocation(entry)).toEqual([{ locations: ['池', '瀑布下游'], seasons: ['夏'], note: null }])
  })

  it('splits season+note segments and does not let 瀑布下 swallow 瀑布下游', () => {
    // 小河蟹的真實資料：兩地點各自季節與備註都不同
    const entry = {
      location: '淺灘（左1）：夏，夜晚；淺灘（右6）：春夏秋，夜晚',
      season: ['春', '夏', '秋'],
    }
    expect(parseFishLocation(entry)).toEqual([
      { locations: ['淺灘（左1）'], seasons: ['夏'], note: '夜晚' },
      { locations: ['淺灘（右6）'], seasons: ['春', '夏', '秋'], note: '夜晚' },
    ])
  })

  it('keeps 瀑布下 and 瀑布下游 distinct when both appear in one segment', () => {
    const entry = { location: '瀑布下、瀑布下游', season: ['夏'] }
    expect(parseFishLocation(entry)[0].locations).toEqual(['瀑布下', '瀑布下游'])
  })
})

describe('parseInsectLocation', () => {
  it('handles a plain single-region entry with no colon', () => {
    const entry = { location: '地區4', season: ['夏'] }
    expect(parseInsectLocation(entry)).toEqual([{ locations: ['地區4'], seasons: ['夏'], uncertain: false }])
  })

  it('parses multiple season-qualified segments', () => {
    const entry = { location: '春：地區1、5；秋：地區4；冬：地區6、2', season: ['春', '秋', '冬'] }
    expect(parseInsectLocation(entry)).toEqual([
      { locations: ['地區1', '地區5'], seasons: ['春'], uncertain: false },
      { locations: ['地區4'], seasons: ['秋'], uncertain: false },
      { locations: ['地區6', '地區2'], seasons: ['冬'], uncertain: false },
    ])
  })

  it('flags the real-world 姬螢 case as uncertain instead of guessing a region code', () => {
    const entry = { location: '地區似乎全區', season: ['夏'] }
    expect(parseInsectLocation(entry)).toEqual([
      { locations: [], seasons: ['夏'], uncertain: true, raw: '地區似乎全區' },
    ])
  })
})

describe('buildLocationIndex', () => {
  it('groups fish entries by location, carrying the location-specific season through', () => {
    const entries = [
      { name: '虎魚', location: '淺灘（左1）、淺灘（右6）：秋；池、河川、瀑布下、瀑布下游：春夏秋冬', season: ['春', '夏', '秋', '冬'] },
    ]
    const index = buildLocationIndex(entries, parseFishLocation)
    expect(index.get('淺灘（左1）')).toEqual([{ entry: entries[0], seasons: ['秋'], note: null }])
    expect(index.get('池')[0].seasons).toEqual(['春', '夏', '秋', '冬'])
  })

  it('routes uncertain insect segments into the UNCERTAIN_KEY bucket, not a guessed location', () => {
    const entries = [{ name: '姬螢', location: '地區似乎全區', season: ['夏'] }]
    const index = buildLocationIndex(entries, parseInsectLocation)
    expect(index.has('地區1')).toBe(false)
    expect(index.get(UNCERTAIN_KEY)).toEqual([{ entry: entries[0], seasons: ['夏'], raw: '地區似乎全區' }])
  })
})
