import { describe, expect, it } from 'vitest'
import {
  extractPortrait,
  extractRetrievedDate,
  extractSources,
  openExternalLinksInNewTab,
  resolveFamilyLinks,
  stripCharacterIntro,
  stripCharacterTemplateSections,
  stripEditorialNotes,
  stripPortraitImage,
  stripRecipeTemplateSections,
} from './entryTransforms.js'

describe('stripEditorialNotes', () => {
  it('removes editorial blockquotes (命名說明/資料修正/關於…) including continuation lines', () => {
    const markdown = [
      '內文第一段。',
      '',
      '> **命名說明**：來源寫「杏仁酒」，',
      '> 但日文名あんず＝杏子。',
      '',
      '> **資料修正（2026-07-12）**：原判斷錯誤。',
      '',
      '## 相關',
    ].join('\n')
    const result = stripEditorialNotes(markdown)
    expect(result).not.toContain('命名說明')
    expect(result).not.toContain('資料修正')
    expect(result).toContain('內文第一段。')
    expect(result).toContain('## 相關')
  })

  it('keeps gameplay-info blockquotes (e.g. > **注意**：賣價為 5★ 品質)', () => {
    const markdown = '> **注意**：以下所有售價均為 5★ 品質的賣價。\n\n內文。'
    expect(stripEditorialNotes(markdown)).toContain('注意')
  })
})

describe('stripRecipeTemplateSections', () => {
  const templated = [
    '三明治（サンドイッチ）是拼盤類（オードブル）料理，不需廚具，直接混合食材即可。',
    '',
    '## 食譜',
    '',
    '- 材料：麵包（パン）＋黃瓜（きゅうり）',
    '- 5★ 賣價：880 G',
    '',
    '## 相關',
    '',
    '- [[拼盤類料理總覽]]',
    '',
    '## 來源',
    '',
    '- [食譜篇](https://example.com)，擷取於 2026-06-30',
  ].join('\n')

  it('removes intro sentence and 食譜/相關/來源 sections entirely (all derivable from frontmatter)', () => {
    expect(stripRecipeTemplateSections(templated)).toBe('')
  })

  it('keeps recipe-specific sections like 食譜改寫與可追加材料', () => {
    const withExtra = `${templated}\n\n## 食譜改寫與可追加材料\n\n- 可追加香菇（しいたけ）提高賣價`
    const result = stripRecipeTemplateSections(withExtra)
    expect(result).toContain('## 食譜改寫與可追加材料')
    expect(result).toContain('可追加香菇')
    expect(result).not.toContain('## 食譜\n')
    expect(result).not.toContain('拼盤類料理總覽')
  })
})

describe('stripCharacterTemplateSections', () => {
  const characterBody = [
    '亞修（アーシュ）是[[藍鈴村]]動物店的幫手，生日為春天第 20 天。',
    '',
    '## 家庭關係',
    '',
    '- 母親：[[藍鈴村-傑西卡|傑西卡（ジェシカ）]]',
    '',
    '## 禮物攻略',
    '',
    '**最喜歡**：多利亞焗飯（ドリア）。',
    '',
    '## 約會資訊',
    '',
    '可在週二、週三、週六的 11:00–16:00 約會。',
    '',
    '## 每日路線時間表',
    '',
    '**星期日**',
    '- 6:00～7:00 自宅',
    '',
    '## 來源',
    '',
    '- [戀愛對象詳細](https://example.com/a)，擷取於 2026-06-30',
  ].join('\n')

  it('removes 禮物攻略/約會資訊/家庭關係/來源 (frontmatter-derivable, C11) but keeps intro, 路線時間表', () => {
    const result = stripCharacterTemplateSections(characterBody)
    expect(result).not.toContain('禮物攻略')
    expect(result).not.toContain('約會資訊')
    expect(result).not.toContain('## 家庭關係')
    expect(result).not.toContain('## 來源')
    expect(result).toContain('動物店的幫手')
    expect(result).toContain('## 每日路線時間表')
  })

  it('removes the 禮物攻略重點 variant used by non-marriageable villagers', () => {
    const result = stripCharacterTemplateSections('## 禮物攻略重點\n\n偏好辛辣料理。\n\n## 商店\n\n營業中。')
    expect(result).not.toContain('偏好辛辣料理')
    expect(result).toContain('## 商店')
  })
})

describe('stripCharacterIntro', () => {
  it('removes the editorial intro paragraph before the first section heading', () => {
    const markdown = '娜娜（ナナ）是種子屋的助手，生日為春天第 27 天。\n\n## 每日路線時間表\n\n- 6:00 自宅'
    const result = stripCharacterIntro(markdown)
    expect(result).not.toContain('種子屋的助手')
    expect(result.startsWith('## 每日路線時間表')).toBe(true)
  })

  it('returns empty string when no sections remain (villager with intro only)', () => {
    expect(stripCharacterIntro('伊爾薩（イルサ）是此花村的官員。')).toBe('')
  })
})

describe('resolveFamilyLinks', () => {
  const table = new Map([['傑西卡', { href: '#/c/characters/藍鈴村-傑西卡' }]])

  it('splits 關係：中文（日文） and resolves the name against the wikilink table', () => {
    const warnings = []
    const result = resolveFamilyLinks(['母親：傑西卡（ジェシカ）'], table, warnings, 'characters/x')
    expect(result).toEqual([
      { relation: '母親', zh: '傑西卡', jp: 'ジェシカ', href: '#/c/characters/藍鈴村-傑西卡' },
    ])
    expect(warnings).toEqual([])
  })

  it('keeps plain text and warns when the name is not found in the site (no guessing)', () => {
    const warnings = []
    const result = resolveFamilyLinks(['青梅竹馬：卡米爾（カミル）'], table, warnings, 'characters/x')
    expect(result).toEqual([{ relation: '青梅竹馬', zh: '卡米爾', jp: 'カミル', href: null }])
    expect(warnings).toEqual(['family 查無站內角色「卡米爾」（來源：characters/x）'])
  })

  it('returns undefined when there is no family field', () => {
    expect(resolveFamilyLinks(undefined, table, [], 'characters/x')).toBeUndefined()
  })
})

describe('stripPortraitImage', () => {
  it('removes only the portrait line (alt starts with name), keeps other images', () => {
    const markdown = [
      '## 每日路線時間表',
      '',
      '![亞修（アーシュ）](../images/x/portrait.jpg)',
      '![居住地點外觀：動物屋](../images/x/house.jpg)',
    ].join('\n')
    const result = stripPortraitImage(markdown, '亞修')
    expect(result).not.toContain('portrait.jpg')
    expect(result).toContain('house.jpg')
  })

  it('returns markdown unchanged when no image matches', () => {
    const markdown = '![居住地點外觀](../images/x/house.jpg)'
    expect(stripPortraitImage(markdown, '亞修')).toBe(markdown)
  })
})

describe('extractSources', () => {
  it('parses multiple 來源 bullets with titles and retrieved dates', () => {
    const markdown = [
      '## 每日路線時間表',
      '',
      '- 6:00 自宅',
      '',
      '## 來源',
      '',
      '- [戀愛對象詳細](https://example.com/a)，擷取於 2026-06-30',
      '- [路線時間](https://example.com/b)，擷取於 2026-07-05',
    ].join('\n')
    expect(extractSources(markdown)).toEqual([
      { title: '戀愛對象詳細', url: 'https://example.com/a', retrieved: '2026-06-30' },
      { title: '路線時間', url: 'https://example.com/b', retrieved: '2026-07-05' },
    ])
  })

  it('omits retrieved when the bullet has no date, and stops at the next section', () => {
    const markdown = '## 來源\n\n- [出處](https://example.com)\n\n## 其他\n\n- [不是來源](https://example.com/x)'
    expect(extractSources(markdown)).toEqual([{ title: '出處', url: 'https://example.com' }])
  })

  it('returns undefined when there is no 來源 section', () => {
    expect(extractSources('內文而已')).toBeUndefined()
  })
})

describe('openExternalLinksInNewTab', () => {
  it('adds target and rel to external http(s) links only', () => {
    const html =
      '<p><a href="https://example.com/a">外部</a>與<a href="#/c/characters/米海爾">站內</a></p>'
    expect(openExternalLinksInNewTab(html)).toBe(
      '<p><a target="_blank" rel="noreferrer" href="https://example.com/a">外部</a>與<a href="#/c/characters/米海爾">站內</a></p>',
    )
  })

  it('handles multiple external links in one document', () => {
    const html = '<a href="http://a.example">A</a><a href="https://b.example">B</a>'
    const result = openExternalLinksInNewTab(html)
    expect(result.match(/target="_blank"/g)).toHaveLength(2)
  })
})

describe('extractRetrievedDate', () => {
  it('pulls the 擷取於 date out of the 來源 block', () => {
    expect(extractRetrievedDate('- [食譜篇](https://example.com)，擷取於 2026-06-30')).toBe(
      '2026-06-30',
    )
  })

  it('returns undefined when no date is present', () => {
    expect(extractRetrievedDate('內文沒有來源日期')).toBeUndefined()
  })
})

describe('extractPortrait', () => {
  it('returns the first image whose alt starts with the character name, path rewritten', () => {
    const markdown = [
      '![娜娜（ナナ）](../images/leomoon173-pixnet-5012321571/aaa.jpg)',
      '![居住地點外觀](../images/leomoon173-pixnet-5012321571/bbb.jpg)',
    ].join('\n')
    expect(extractPortrait(markdown, '娜娜', '/base/')).toBe(
      '/base/images/leomoon173-pixnet-5012321571/aaa.jpg',
    )
  })

  it('ignores non-portrait images and returns undefined when none match', () => {
    const markdown = '![居住地點外觀](../images/x/bbb.jpg)'
    expect(extractPortrait(markdown, '娜娜', '/base/')).toBeUndefined()
  })
})
