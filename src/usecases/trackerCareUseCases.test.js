import { describe, expect, it } from 'vitest'
import { careAnimalUseCase, feedTreatUseCase, waterPlotUseCase } from './trackerCareUseCases.js'

function createMockStorage() {
  const data = {}
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

const day1 = { year: 1, season: '春', day: 1 }

describe('waterPlotUseCase', () => {
  it('waters the matching plot and persists the save', () => {
    const save = { plots: [{ id: 'p1', wateredDays: 0, lastWatered: null }], animals: [] }
    const storage = createMockStorage()

    const result = waterPlotUseCase(save, 'p1', day1, storage)

    expect(result.plots[0]).toEqual({ id: 'p1', wateredDays: 1, lastWatered: day1 })
    expect(JSON.parse(storage.getItem('hmtv:save:v1')).plots[0].wateredDays).toBe(1)
  })

  it('calling twice on the same day leaves the saved plot state unchanged', () => {
    const save = { plots: [{ id: 'p1', wateredDays: 0, lastWatered: null }], animals: [] }
    const storage = createMockStorage()

    const first = waterPlotUseCase(save, 'p1', day1, storage)
    const second = waterPlotUseCase(first, 'p1', day1, storage)

    expect(second.plots[0]).toEqual(first.plots[0])
  })
})

describe('careAnimalUseCase', () => {
  it('cares for the matching animal and persists the save, no-op same day', () => {
    const save = { plots: [], animals: [{ id: 'a1', careDays: 0, lastCared: null }] }
    const storage = createMockStorage()

    const first = careAnimalUseCase(save, 'a1', day1, storage)
    expect(first.animals[0]).toEqual({ id: 'a1', careDays: 1, lastCared: day1 })

    const second = careAnimalUseCase(first, 'a1', day1, storage)
    expect(second.animals[0]).toEqual(first.animals[0])
  })
})

describe('feedTreatUseCase', () => {
  it('feeds the given treat type and persists the save, no-op same day', () => {
    const save = {
      plots: [],
      animals: [{ id: 'a1', treatsFed: { 茶點: 0, 野菜: 0, 穀物: 0, 魚味: 0 }, lastTreated: null }],
    }
    const storage = createMockStorage()

    const first = feedTreatUseCase(save, 'a1', '魚味', day1, storage)
    expect(first.animals[0].treatsFed.魚味).toBe(1)

    const second = feedTreatUseCase(first, 'a1', '魚味', day1, storage)
    expect(second.animals[0]).toEqual(first.animals[0])
  })
})
