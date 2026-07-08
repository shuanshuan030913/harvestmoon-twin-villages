import { describe, expect, it } from 'vitest'
import { findRemindersForDate } from './reminders.js'

const characters = [
  { name: '娜娜', birthday: '春-27' },
  { name: '古恩貝', birthday: '夏-3' },
]
const festivals = [
  { name: '賞花日', season: '春', day: 27 },
  { name: '動物祭', season: ['春', '夏', '秋'], day: 5 },
]

describe('findRemindersForDate', () => {
  it('finds the birthday and festival reminders for 春-27', () => {
    const reminders = findRemindersForDate({ year: 1, season: '春', day: 27 }, { characters, festivals })
    expect(reminders.characters.map((c) => c.name)).toEqual(['娜娜'])
    expect(reminders.festivals.map((f) => f.name)).toEqual(['賞花日'])
  })

  it('matches a multi-season festival only on the right day', () => {
    const reminders = findRemindersForDate({ year: 1, season: '夏', day: 5 }, { characters, festivals })
    expect(reminders.festivals.map((f) => f.name)).toEqual(['動物祭'])
  })

  it('returns empty reminder arrays when nothing matches', () => {
    const reminders = findRemindersForDate({ year: 1, season: '冬', day: 1 }, { characters, festivals })
    expect(reminders).toEqual({ characters: [], festivals: [] })
  })
})
