import { isSameDate } from './gameCalendar.js'

function applyIdempotentDaily(entity, today, lastDateKey, applyChange) {
  if (isSameDate(entity[lastDateKey], today)) return entity
  return { ...applyChange(entity), [lastDateKey]: today }
}

export function waterPlot(plot, today) {
  return applyIdempotentDaily(plot, today, 'lastWatered', (p) => ({
    ...p,
    wateredDays: p.wateredDays + 1,
  }))
}

export function careAnimal(animal, today) {
  return applyIdempotentDaily(animal, today, 'lastCared', (a) => ({
    ...a,
    careDays: a.careDays + 1,
  }))
}

// 無日期點心計數調整（2026-07-14 虛擬日期移除後的記帳模式）：
// +1 記餵食、-1 復原誤觸，計數不低於 0。每日限 1 為遊戲內規則，由玩家在遊戲中遵守。
export function adjustTreat(animal, treatType, delta) {
  const current = animal.treatsFed?.[treatType] ?? 0
  const next = Math.max(0, current + delta)
  if (next === current) return animal
  return { ...animal, treatsFed: { ...animal.treatsFed, [treatType]: next } }
}

export function feedTreat(animal, treatType, today) {
  return applyIdempotentDaily(animal, today, 'lastTreated', (a) => ({
    ...a,
    treatsFed: { ...a.treatsFed, [treatType]: (a.treatsFed[treatType] ?? 0) + 1 },
  }))
}

export function harvestPlot(plot, regrowable, today) {
  if (regrowable) {
    return { ...plot, wateredDays: 0, plantedOn: today, status: 'growing' }
  }
  return { ...plot, status: 'harvested' }
}

export function computeHarvestCountdown({ min, max }, wateredDays) {
  const minDaysLeft = Math.max(0, min - wateredDays)
  const maxDaysLeft = Math.max(0, max - wateredDays)

  let readiness = 'growing'
  if (wateredDays >= max) readiness = 'ready'
  else if (wateredDays >= min) readiness = 'maybeReady'

  return { minDaysLeft, maxDaysLeft, readiness }
}
