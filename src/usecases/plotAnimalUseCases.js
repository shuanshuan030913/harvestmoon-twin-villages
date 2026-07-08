import { harvestPlot } from '../utils/tracker.js'
import { saveSave } from '../utils/storage.js'

function updateById(list, id, updater) {
  return list.map((item) => (item.id === id ? updater(item) : item))
}

export function addPlot(save, cropSlug, today, storage = globalThis.localStorage) {
  const plot = {
    id: crypto.randomUUID(),
    cropSlug,
    plantedOn: today,
    wateredDays: 0,
    lastWatered: null,
    status: 'growing',
    note: '',
  }
  const newSave = { ...save, plots: [...save.plots, plot] }
  saveSave(newSave, storage)
  return newSave
}

export function addAnimal(save, animalSlug, nickname, storage = globalThis.localStorage) {
  const animal = {
    id: crypto.randomUUID(),
    animalSlug,
    nickname,
    careDays: 0,
    lastCared: null,
    treatsFed: { 茶點: 0, 野菜: 0, 穀物: 0, 魚味: 0 },
    lastTreated: null,
  }
  const newSave = { ...save, animals: [...save.animals, animal] }
  saveSave(newSave, storage)
  return newSave
}

export function removePlot(save, plotId, storage = globalThis.localStorage) {
  const newSave = { ...save, plots: save.plots.filter((plot) => plot.id !== plotId) }
  saveSave(newSave, storage)
  return newSave
}

// slug 失配容錯：cropSlug 在現行 crops 資料查無時（條目改名/刪除），
// regrowable 無從得知，保守預設 false（單次收成，不刪不改玩家原始資料）。
export function harvestPlotUseCase(save, plotId, crops, today, storage = globalThis.localStorage) {
  const plot = save.plots.find((p) => p.id === plotId)
  const crop = crops.find((c) => c.slug === plot?.cropSlug)
  const regrowable = crop?.regrowable ?? false

  const newSave = {
    ...save,
    plots: updateById(save.plots, plotId, (p) => harvestPlot(p, regrowable, today)),
  }
  saveSave(newSave, storage)
  return newSave
}
