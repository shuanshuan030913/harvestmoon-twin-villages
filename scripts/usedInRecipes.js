// 「A 或 B」擇一群組（resolveItemStrings 的 alternatives 結構）攤平成個別項目，
// 讓群組內每個實際存在 href 的物品都拿得到「可做料理」信用。
function flattenLinks(links) {
  return links.flatMap((item) => item.alternatives ?? [item])
}

// recipes 既有的 ingredientsLinks（依 href 解析結果）反向歸戶：被引用的食材條目
// （crops/fishes/minerals/items，以及料理作食材的其他 recipes）也能顯示「可以做哪些
// 料理」（U57①，2026-07-23）。手法沿用 giftFans.js 的 attachGiftFans。
// 呼叫時機：必須在 recipes 的 ingredientsLinks 解析完成、且目標 collection 尚未
// 序列化輸出前執行——build-content.js 在 recipes 走完當下呼叫即滿足此順序。
export function attachUsedInRecipes(collections, computeHref) {
  const hrefIndex = new Map()
  for (const [name, entries] of Object.entries(collections)) {
    if (name === 'characters' || name === 'guides') continue
    for (const entry of entries) hrefIndex.set(computeHref(name, entry), entry)
  }

  for (const recipe of collections.recipes) {
    const links = recipe.ingredientsLinks
    if (!links) continue
    const usage = {
      zh: recipe.name,
      jp: recipe.name_jp,
      href: computeHref('recipes', recipe),
    }
    for (const item of flattenLinks(links)) {
      if (!item.href) continue
      const target = hrefIndex.get(item.href)
      if (!target) continue
      target.usedInRecipes ??= []
      target.usedInRecipes.push(usage)
    }
  }
}
