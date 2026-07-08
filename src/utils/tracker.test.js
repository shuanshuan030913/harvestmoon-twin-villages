import { describe, expect, it } from 'vitest'
import { feedTreat, waterPlot } from './tracker.js'

const day1 = { year: 1, season: '春', day: 1 }
const day2 = { year: 1, season: '春', day: 2 }

describe('waterPlot', () => {
  const basePlot = { id: '1', cropSlug: 'cassabranca', wateredDays: 0, lastWatered: null }

  it('increments wateredDays and sets lastWatered', () => {
    const result = waterPlot(basePlot, day1)
    expect(result).toEqual({ ...basePlot, wateredDays: 1, lastWatered: day1 })
  })

  it('is a no-op when watered twice on the same day', () => {
    const once = waterPlot(basePlot, day1)
    const twice = waterPlot(once, day1)
    expect(twice).toEqual(once)
  })

  it('accumulates on the next day', () => {
    const day1Result = waterPlot(basePlot, day1)
    const day2Result = waterPlot(day1Result, day2)
    expect(day2Result).toEqual({ ...basePlot, wateredDays: 2, lastWatered: day2 })
  })
})

describe('feedTreat', () => {
  const baseAnimal = {
    id: '1',
    animalSlug: 'sheep',
    treatsFed: { 茶點: 0, 野菜: 0, 穀物: 0, 魚味: 0 },
    lastTreated: null,
  }

  it('increments the given treat type and sets lastTreated', () => {
    const result = feedTreat(baseAnimal, '魚味', day1)
    expect(result).toEqual({
      ...baseAnimal,
      treatsFed: { ...baseAnimal.treatsFed, 魚味: 1 },
      lastTreated: day1,
    })
  })

  it('is a no-op when fed twice on the same day, regardless of treat type', () => {
    const once = feedTreat(baseAnimal, '魚味', day1)
    const twice = feedTreat(once, '茶點', day1)
    expect(twice).toEqual(once)
  })

  it('accumulates on the next day', () => {
    const day1Result = feedTreat(baseAnimal, '魚味', day1)
    const day2Result = feedTreat(day1Result, '魚味', day2)
    expect(day2Result).toEqual({
      ...baseAnimal,
      treatsFed: { ...baseAnimal.treatsFed, 魚味: 2 },
      lastTreated: day2,
    })
  })
})
