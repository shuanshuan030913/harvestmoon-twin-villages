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

  it('matches a festival defined via occurrences (per-village different day, e.g. 花之日)', () => {
    const occurrenceFestivals = [
      {
        name: '花之日',
        season: ['夏', '秋'],
        occurrences: [
          { season: '夏', day: 10, village: '藍鈴村' },
          { season: '秋', day: 18, village: '此花村' },
        ],
      },
    ]

    const summerMatch = findRemindersForDate(
      { year: 1, season: '夏', day: 10 },
      { festivals: occurrenceFestivals },
    )
    expect(summerMatch.festivals.map((f) => f.name)).toEqual(['花之日'])

    const noMatch = findRemindersForDate({ year: 1, season: '夏', day: 18 }, { festivals: occurrenceFestivals })
    expect(noMatch.festivals).toEqual([])

    const autumnMatch = findRemindersForDate(
      { year: 1, season: '秋', day: 18 },
      { festivals: occurrenceFestivals },
    )
    expect(autumnMatch.festivals.map((f) => f.name)).toEqual(['花之日'])
  })
})
