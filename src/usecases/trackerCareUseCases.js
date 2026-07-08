import { careAnimal, feedTreat, waterPlot } from '../utils/tracker.js'
import { saveSave } from '../utils/storage.js'

function updateById(list, id, updater) {
  return list.map((item) => (item.id === id ? updater(item) : item))
}

export function waterPlotUseCase(save, plotId, today, storage = globalThis.localStorage) {
  const newSave = { ...save, plots: updateById(save.plots, plotId, (plot) => waterPlot(plot, today)) }
  saveSave(newSave, storage)
  return newSave
}

export function careAnimalUseCase(save, animalId, today, storage = globalThis.localStorage) {
  const newSave = {
    ...save,
    animals: updateById(save.animals, animalId, (animal) => careAnimal(animal, today)),
  }
  saveSave(newSave, storage)
  return newSave
}

export function feedTreatUseCase(
  save,
  animalId,
  treatType,
  today,
  storage = globalThis.localStorage,
) {
  const newSave = {
    ...save,
    animals: updateById(save.animals, animalId, (animal) => feedTreat(animal, treatType, today)),
  }
  saveSave(newSave, storage)
  return newSave
}
