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
