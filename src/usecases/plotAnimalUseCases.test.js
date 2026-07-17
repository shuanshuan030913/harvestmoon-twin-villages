import { describe, expect, it } from 'vitest'
import { addAnimal, addPlot, harvestPlotUseCase, removeAnimal, removePlot } from './plotAnimalUseCases.js'

function createMockStorage() {
  const data = {}
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

const today = { year: 1, season: '春', day: 1 }
const crops = [{ slug: 'cassabranca', regrowable: false }, { slug: 'tomato', regrowable: true }]

describe('addPlot', () => {
  it('generates a uuid and appends a new growing plot', () => {
    const save = { plots: [], animals: [] }
    const storage = createMockStorage()

    const result = addPlot(save, 'cassabranca', today, storage)

    expect(result.plots).toHaveLength(1)
    expect(result.plots[0]).toMatchObject({
      cropSlug: 'cassabranca',
      plantedOn: today,
      wateredDays: 0,
      lastWatered: null,
      status: 'growing',
    })
    expect(result.plots[0].id).toBeTypeOf('string')
    expect(result.plots[0].id.length).toBeGreaterThan(0)
  })
})

describe('addAnimal', () => {
  it('generates a uuid and appends a new tracked animal', () => {
    const save = { plots: [], animals: [] }
    const storage = createMockStorage()

    const result = addAnimal(save, 'sheep', '小羊', storage)

    expect(result.animals).toHaveLength(1)
    expect(result.animals[0]).toMatchObject({
      animalSlug: 'sheep',
      nickname: '小羊',
      careDays: 0,
      treatsFed: { 茶點: 0, 野菜: 0, 穀物: 0, 魚味: 0 },
    })
    expect(result.animalsUpdatedAt).toBeTypeOf('string')
  })
})

describe('removeAnimal', () => {
  it('removes only the matching animal and stamps animalsUpdatedAt', () => {
    const save = { plots: [], animals: [{ id: 'a1' }, { id: 'a2' }] }
    const storage = createMockStorage()

    const result = removeAnimal(save, 'a1', storage)

    expect(result.animals).toEqual([{ id: 'a2' }])
    expect(result.animalsUpdatedAt).toBeTypeOf('string')
  })
})

describe('removePlot', () => {
  it('removes only the matching plot', () => {
    const save = { plots: [{ id: 'p1' }, { id: 'p2' }], animals: [] }
    const storage = createMockStorage()

    const result = removePlot(save, 'p1', storage)

    expect(result.plots).toEqual([{ id: 'p2' }])
  })
})

describe('harvestPlotUseCase', () => {
  it('uses the crop entry regrowable flag when the slug is found', () => {
    const save = {
      plots: [{ id: 'p1', cropSlug: 'tomato', wateredDays: 10, plantedOn: null, status: 'growing' }],
      animals: [],
    }
    const storage = createMockStorage()

    const result = harvestPlotUseCase(save, 'p1', crops, today, storage)

    expect(result.plots[0]).toMatchObject({ wateredDays: 0, plantedOn: today, status: 'growing' })
  })

  it('falls back to regrowable=false without crashing when the crop slug is not found', () => {
    const save = {
      plots: [
        {
          id: 'p1',
          cropSlug: '已刪除的作物',
          wateredDays: 10,
          plantedOn: null,
          status: 'growing',
          note: '',
        },
      ],
      animals: [],
    }
    const storage = createMockStorage()

    expect(() => harvestPlotUseCase(save, 'p1', crops, today, storage)).not.toThrow()
    const result = harvestPlotUseCase(save, 'p1', crops, today, storage)

    // 不刪不藏：原始 cropSlug 等資料原封不動保留
    expect(result.plots[0]).toEqual({
      id: 'p1',
      cropSlug: '已刪除的作物',
      wateredDays: 10,
      plantedOn: null,
      status: 'harvested',
      note: '',
    })
  })
})
