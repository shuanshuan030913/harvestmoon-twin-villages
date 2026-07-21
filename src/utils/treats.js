// 副產品升級以「湊滿當輪配方」為準（2026-07-21 使用者裁決，U35）：現行等級＝
// 1 加上所有點心種類中「已達成門檻數」最少的那個——跑最慢的種類決定實際等級，
// 不是任一種類各自獨立比較自己的下一階。已超前的種類在同一輪的還差顯示 0，
// 累計數本身不會被浪費（treatsFed 永遠累計不歸零）：等其餘種類跟上、等級真正
// 推進後，該種類的累計數自然承接下一輪門檻的比較基準。
const TIER_COUNT = 4

export function computeTreatProgress(treatRequirements, treatsFed) {
  if (!treatRequirements) return null

  const entries = Object.entries(treatRequirements).filter(([, thresholds]) => thresholds !== null)
  if (entries.length === 0) return null

  const satisfiedCounts = entries.map(([type, thresholds]) => {
    const fed = treatsFed?.[type] ?? 0
    return thresholds.filter((threshold) => fed >= threshold).length
  })
  const minSatisfied = Math.min(...satisfiedCounts)
  const tier = 1 + minSatisfied

  if (minSatisfied >= TIER_COUNT) {
    return { tier, shortfall: null, maxed: true }
  }

  const shortfall = {}
  for (const [type, thresholds] of entries) {
    const fed = treatsFed?.[type] ?? 0
    shortfall[type] = Math.max(0, thresholds[minSatisfied] - fed)
  }
  return { tier, shortfall, maxed: false }
}
