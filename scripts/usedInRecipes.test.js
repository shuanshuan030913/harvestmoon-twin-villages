import { describe, expect, it } from 'vitest'
import { attachUsedInRecipes } from './usedInRecipes.js'

function computeHref(collectionName, entry) {
  return `#/c/${collectionName}/${entry.slug}`
}

describe('attachUsedInRecipes', () => {
  it('reverse-indexes a recipe onto each ingredient it links to', () => {
    const tomato = { slug: '番茄', name: '番茄' }
    const sandwich = {
      slug: '三明治',
      name: '三明治',
      name_jp: 'サンドイッチ',
      ingredientsLinks: [{ zh: '番茄', jp: 'トマト', href: '#/c/crops/番茄' }],
    }
    const collections = { recipes: [sandwich], crops: [tomato] }

    attachUsedInRecipes(collections, computeHref)

    expect(tomato.usedInRecipes).toEqual([
      { zh: '三明治', jp: 'サンドイッチ', href: '#/c/recipes/三明治' },
    ])
  })

  it('flattens 「A 或 B」 alternatives so each real target still gets credit', () => {
    const boiledEgg = { slug: '煮雞蛋', name: '煮雞蛋' }
    const mayo = { slug: '蛋黃醬', name: '蛋黃醬' }
    const sandwich = {
      slug: '三明治',
      name: '三明治',
      ingredientsLinks: [
        {
          alternatives: [
            { zh: '煮雞蛋', jp: 'ゆで卵', href: '#/c/recipes/煮雞蛋' },
            { zh: '蛋黃醬', jp: 'マヨネーズ', href: '#/c/items/蛋黃醬' },
          ],
        },
      ],
    }
    const collections = { recipes: [sandwich, boiledEgg], items: [mayo] }

    attachUsedInRecipes(collections, computeHref)

    expect(boiledEgg.usedInRecipes).toHaveLength(1)
    expect(mayo.usedInRecipes).toHaveLength(1)
  })

  it('ignores unresolved links (href: null) and never targets characters/guides collections', () => {
    const recipe = {
      slug: 'x',
      name: 'x',
      ingredientsLinks: [{ zh: '查無食材', jp: null, href: null }],
    }
    const otherRecipe = { slug: 'y', name: 'y' }
    const guide = { slug: 'z', system: 'cooking', title: 'guide' }
    const collections = { recipes: [recipe, otherRecipe], guides: [guide] }

    expect(() => attachUsedInRecipes(collections, computeHref)).not.toThrow()
    expect(otherRecipe.usedInRecipes).toBeUndefined()
    expect(guide.usedInRecipes).toBeUndefined()
  })

  it('accumulates multiple recipes onto the same ingredient', () => {
    const mushroom = { slug: '香菇', name: '香菇' }
    const a = { slug: 'a', name: 'A', ingredientsLinks: [{ zh: '香菇', jp: null, href: '#/c/items/香菇' }] }
    const b = { slug: 'b', name: 'B', ingredientsLinks: [{ zh: '香菇', jp: null, href: '#/c/items/香菇' }] }
    const collections = { recipes: [a, b], items: [mushroom] }

    attachUsedInRecipes(collections, computeHref)

    expect(mushroom.usedInRecipes.map((usage) => usage.zh)).toEqual(['A', 'B'])
  })
})
