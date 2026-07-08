import { describe, expect, it } from 'vitest'
import { computeTreatShortfall } from './treats.js'

const sheepRequirements = {
  茶點: [2, 4, 6, 8],
  野菜: [12, 24, 36, 48],
  穀物: [12, 24, 36, 48],
  魚味: [5, 10, 15, 20],
}

describe('computeTreatShortfall', () => {
  it('computes the real-world 羊 case: fed 魚味=3, still need 茶點2/野菜12/穀物12/魚味2', () => {
    const treatsFed = { 茶點: 0, 野菜: 0, 穀物: 0, 魚味: 3 }
    expect(computeTreatShortfall(sheepRequirements, treatsFed)).toEqual({
      茶點: 2,
      野菜: 12,
      穀物: 12,
      魚味: 2,
    })
  })

  it('excludes categories the animal does not eat (null)', () => {
    const alpacaRequirements = { ...sheepRequirements, 茶點: null }
    const shortfall = computeTreatShortfall(alpacaRequirements, {})
    expect(shortfall).not.toHaveProperty('茶點')
  })

  it('returns null when treat_requirements is missing entirely', () => {
    expect(computeTreatShortfall(undefined, { 魚味: 3 })).toBeNull()
  })

  it('clamps to 0 once the final threshold is reached', () => {
    const treatsFed = { 魚味: 20 }
    expect(computeTreatShortfall(sheepRequirements, treatsFed).魚味).toBe(0)
  })
})
