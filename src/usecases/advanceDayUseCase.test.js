import { describe, expect, it } from 'vitest'
import { advanceDayUseCase } from './advanceDayUseCase.js'

function createMockStorage() {
  const data = {}
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value
    },
    _data: data,
  }
}

const characters = [
  { slug: '此花村-娜娜', name: '娜娜', birthday: '春-27' },
  { slug: '此花村-古恩貝', name: '古恩貝', birthday: '夏-3' },
]

const festivals = [
  { name: '賞花日', season: '春', day: 27 },
  { name: '動物祭', season: ['春', '夏', '秋'], day: 5 },
]

describe('advanceDayUseCase', () => {
  it('advancing to 春-27 returns 娜娜 as a birthday reminder', () => {
    const save = { calendar: { year: 1, season: '春', day: 26 }, plots: [] }
    const storage = createMockStorage()

    const { save: newSave, reminders } = advanceDayUseCase(save, { characters, festivals }, storage)

    expect(newSave.calendar).toEqual({ year: 1, season: '春', day: 27 })
    expect(reminders.characters.map((c) => c.name)).toEqual(['娜娜'])
    expect(reminders.festivals.map((f) => f.name)).toEqual(['賞花日'])
  })

  it('matches a multi-season festival only on the right day', () => {
    const save = { calendar: { year: 1, season: '夏', day: 4 }, plots: [] }
    const storage = createMockStorage()

    const { reminders } = advanceDayUseCase(save, { characters, festivals }, storage)

    expect(reminders.festivals.map((f) => f.name)).toEqual(['動物祭'])
    expect(reminders.characters).toEqual([])
  })

  it('persists the advanced save to storage', () => {
    const save = { calendar: { year: 1, season: '春', day: 26 }, plots: [] }
    const storage = createMockStorage()

    advanceDayUseCase(save, { characters, festivals }, storage)

    expect(JSON.parse(storage._data['hmtv:save:v1']).calendar).toEqual({
      year: 1,
      season: '春',
      day: 27,
    })
  })
})
