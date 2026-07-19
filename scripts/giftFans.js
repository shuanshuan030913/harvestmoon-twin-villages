const GIFT_LEVELS = ['loves', 'likes', 'hates', 'loathes']

// 「A 或 B」擇一群組（resolveItemStrings 的 alternatives 結構）攤平成個別項目，
// 讓群組內每個實際存在 href 的物品都拿得到送禮名單信用。
function flattenLinks(links) {
  return links.flatMap((item) => item.alternatives ?? [item])
}

// characters 既有的 lovesLinks/likesLinks/hatesLinks/loathesLinks（依 href 解析結果）
// 反向歸戶：被喜好指到的條目（crops/items/fishes/recipes/insects/minerals）也能顯示
// 「誰喜歡我」的送禮名單（U27，2026-07-20）。characters/guides 本身不是送禮對象，排除。
// 呼叫時機：必須在 characters 的四個 *Links 欄位解析完成、且目標 collection 尚未序列化
// 輸出前執行——build-content.js 在 characters 走完當下呼叫即滿足此順序。
export function attachGiftFans(collections, computeHref) {
  const hrefIndex = new Map()
  for (const [name, entries] of Object.entries(collections)) {
    if (name === 'characters' || name === 'guides') continue
    for (const entry of entries) hrefIndex.set(computeHref(name, entry), entry)
  }

  for (const character of collections.characters) {
    const fan = {
      zh: character.name,
      jp: character.name_jp,
      href: computeHref('characters', character),
    }
    for (const level of GIFT_LEVELS) {
      const links = character[`${level}Links`]
      if (!links) continue
      for (const item of flattenLinks(links)) {
        if (!item.href) continue
        const target = hrefIndex.get(item.href)
        if (!target) continue
        target.giftFans ??= {}
        target.giftFans[level] ??= []
        target.giftFans[level].push(fan)
      }
    }
  }
}
