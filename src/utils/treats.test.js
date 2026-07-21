import { describe, expect, it } from 'vitest'
import { computeTreatProgress } from './treats.js'

const sheepRequirements = {
  茶點: [2, 4, 6, 8],
  野菜: [12, 24, 36, 48],
  穀物: [12, 24, 36, 48],
  魚味: [5, 10, 15, 20],
}

describe('computeTreatProgress', () => {
  it('computes the real-world 羊 case: fed 魚味=3, still need 茶點2/野菜12/穀物12/魚味2 at tier 1', () => {
    const treatsFed = { 茶點: 0, 野菜: 0, 穀物: 0, 魚味: 3 }
    expect(computeTreatProgress(sheepRequirements, treatsFed)).toEqual({
      tier: 1,
      shortfall: { 茶點: 2, 野菜: 12, 穀物: 12, 魚味: 2 },
      maxed: false,
    })
  })

  it('gates the shown target on the slowest category — a category fed ahead of the others shows 0, not its own further-along shortfall', () => {
    // 魚味 已餵到 10（滿足自己的門檻 2 級：5、10），但其餘三類仍是 0（門檻 2 級都還沒到）。
    // 湊滿一輪配方才進下一輪：整體仍卡在 tier 1，魚味顯示 0（已滿足這一輪），
    // 其餘三類顯示各自到 tier 2 門檻的還差；魚味「超前」的部分不會被浪費，
    // 只是暫時不會再往前推進顯示的等級。
    const treatsFed = { 茶點: 0, 野菜: 0, 穀物: 0, 魚味: 10 }
    expect(computeTreatProgress(sheepRequirements, treatsFed)).toEqual({
      tier: 1,
      shortfall: { 茶點: 2, 野菜: 12, 穀物: 12, 魚味: 0 },
      maxed: false,
    })
  })

  it('advances the tier once every category catches up to the same threshold count', () => {
    const treatsFed = { 茶點: 2, 野菜: 12, 穀物: 12, 魚味: 10 }
    expect(computeTreatProgress(sheepRequirements, treatsFed)).toEqual({
      tier: 2,
      shortfall: { 茶點: 2, 野菜: 12, 穀物: 12, 魚味: 0 },
      maxed: false,
    })
  })

  it('excludes categories the animal does not eat (null)', () => {
    const alpacaRequirements = { ...sheepRequirements, 茶點: null }
    const progress = computeTreatProgress(alpacaRequirements, {})
    expect(progress.shortfall).not.toHaveProperty('茶點')
  })

  it('returns null when treat_requirements is missing entirely', () => {
    expect(computeTreatProgress(undefined, { 魚味: 3 })).toBeNull()
  })

  it('reports maxed once every category has cleared all four thresholds', () => {
    const treatsFed = { 茶點: 8, 野菜: 48, 穀物: 48, 魚味: 20 }
    expect(computeTreatProgress(sheepRequirements, treatsFed)).toEqual({
      tier: 5,
      shortfall: null,
      maxed: true,
    })
  })
})
