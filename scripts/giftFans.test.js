import { describe, expect, it } from 'vitest'
import { attachGiftFans } from './giftFans.js'

function computeHref(collectionName, entry) {
  return `#/c/${collectionName}/${entry.slug}`
}

describe('attachGiftFans', () => {
  it('reverse-indexes a resolved gift link onto its target entry, keyed by level', () => {
    const tomato = { slug: '番茄', name: '番茄' }
    const nana = {
      slug: '娜娜',
      name: '娜娜',
      name_jp: 'ナナ',
      lovesLinks: [{ zh: '番茄', jp: 'トマト', href: '#/c/crops/番茄' }],
    }
    const collections = { characters: [nana], crops: [tomato] }

    attachGiftFans(collections, computeHref)

    expect(tomato.giftFans).toEqual({
      loves: [{ zh: '娜娜', jp: 'ナナ', href: '#/c/characters/娜娜' }],
    })
  })

  it('flattens 「A 或 B」 alternatives so each real target still gets credit', () => {
    const rice = { slug: '米飯', name: '米飯' }
    const soup = { slug: '味噌湯', name: '味噌湯' }
    const character = {
      slug: '角色',
      name: '角色',
      likesLinks: [
        {
          alternatives: [
            { zh: '米飯', jp: 'ごはん', href: '#/c/recipes/米飯' },
            { zh: '味噌湯', jp: 'みそ汁', href: '#/c/recipes/味噌湯' },
          ],
        },
      ],
    }
    const collections = { characters: [character], recipes: [rice, soup] }

    attachGiftFans(collections, computeHref)

    expect(rice.giftFans.likes).toHaveLength(1)
    expect(soup.giftFans.likes).toHaveLength(1)
  })

  it('ignores unresolved links (href: null) and never targets characters/guides collections', () => {
    const character = {
      slug: 'x',
      name: 'x',
      lovesLinks: [{ zh: '查無物品', jp: null, href: null }],
    }
    const otherCharacter = { slug: 'y', name: 'y' }
    const guide = { slug: 'z', system: 'basics', title: 'guide' }
    const collections = { characters: [character, otherCharacter], guides: [guide] }

    expect(() => attachGiftFans(collections, computeHref)).not.toThrow()
    expect(otherCharacter.giftFans).toBeUndefined()
    expect(guide.giftFans).toBeUndefined()
  })

  it('accumulates multiple fans onto the same target and level', () => {
    const dish = { slug: '炊飯', name: '炊飯' }
    const a = { slug: 'a', name: 'A', lovesLinks: [{ zh: '炊飯', jp: null, href: '#/c/recipes/炊飯' }] }
    const b = { slug: 'b', name: 'B', lovesLinks: [{ zh: '炊飯', jp: null, href: '#/c/recipes/炊飯' }] }
    const collections = { characters: [a, b], recipes: [dish] }

    attachGiftFans(collections, computeHref)

    expect(dish.giftFans.loves.map((fan) => fan.zh)).toEqual(['A', 'B'])
  })
})
