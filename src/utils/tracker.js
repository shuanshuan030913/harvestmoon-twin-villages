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

export function feedTreat(animal, treatType, today) {
  return applyIdempotentDaily(animal, today, 'lastTreated', (a) => ({
    ...a,
    treatsFed: { ...a.treatsFed, [treatType]: (a.treatsFed[treatType] ?? 0) + 1 },
  }))
}
