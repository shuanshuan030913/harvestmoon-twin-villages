import { describe, expect, it } from 'vitest'
import { computeHarvestCountdown, feedTreat, harvestPlot, waterPlot } from './tracker.js'

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

describe('harvestPlot', () => {
  const basePlot = {
    id: '1',
    cropSlug: 'cassabranca',
    plantedOn: day1,
    wateredDays: 10,
    lastWatered: day1,
    status: 'growing',
  }

  it('regrowable: true 歸零續種，狀態保持 growing', () => {
    expect(harvestPlot(basePlot, true, day2)).toEqual({
      ...basePlot,
      wateredDays: 0,
      plantedOn: day2,
      status: 'growing',
    })
  })

  it('regrowable: false 轉為 harvested', () => {
    expect(harvestPlot(basePlot, false, day2)).toEqual({
      ...basePlot,
      status: 'harvested',
    })
  })
})

describe('computeHarvestCountdown', () => {
  const growDays = { min: 10, max: 14 }

  it('shows days remaining while still growing', () => {
    expect(computeHarvestCountdown(growDays, 6)).toEqual({
      minDaysLeft: 4,
      maxDaysLeft: 8,
      readiness: 'growing',
    })
  })

  it('shows "maybe ready" once wateredDays >= min', () => {
    expect(computeHarvestCountdown(growDays, 10)).toEqual({
      minDaysLeft: 0,
      maxDaysLeft: 4,
      readiness: 'maybeReady',
    })
  })

  it('shows "ready" once wateredDays >= max', () => {
    expect(computeHarvestCountdown(growDays, 14)).toEqual({
      minDaysLeft: 0,
      maxDaysLeft: 0,
      readiness: 'ready',
    })
  })
})
