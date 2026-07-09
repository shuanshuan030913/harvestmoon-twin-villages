import { useState } from 'react'
import animals from '../data/animals.json'
import { addAnimal } from '../usecases/plotAnimalUseCases.js'
import { careAnimalUseCase } from '../usecases/trackerCareUseCases.js'
import { isSameDate } from '../utils/gameCalendar.js'
import { searchEntries } from '../utils/search.js'
import { GameDialog } from './GameDialog.jsx'

const ANIMALS_BY_SLUG = Object.fromEntries(animals.map((animal) => [animal.slug, animal]))

function AnimalRow({ animal, today, onCare }) {
  const definition = ANIMALS_BY_SLUG[animal.animalSlug]
  const speciesName = definition?.name ?? animal.animalSlug
  const caredToday = isSameDate(animal.lastCared, today)

  return (
    <li className="border-ink/20 bg-cream rounded-xl border p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bold">{animal.nickname}</p>
          <p className="text-ink/50 text-xs">{speciesName}</p>
        </div>
        <button
          type="button"
          onClick={() => onCare(animal.id)}
          disabled={caredToday}
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${
            caredToday ? 'border-ink/20 text-ink/40 bg-transparent' : 'bg-ink text-parchment border-ink'
          }`}
        >
          {caredToday ? '今日已照顧' : '照顧'}
        </button>
      </div>
      <p className="text-ink/60 mt-1 text-xs">已照顧 {animal.careDays} 天</p>
    </li>
  )
}

function AddAnimalDialog({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedSlug, setSelectedSlug] = useState(null)
  const [nickname, setNickname] = useState('')
  const results = query.trim() ? searchEntries(animals, query, ['name', 'name_jp']) : animals

  function reset() {
    setQuery('')
    setSelectedSlug(null)
    setNickname('')
  }

  function handleConfirm() {
    if (!selectedSlug || !nickname.trim()) return
    onAdd(selectedSlug, nickname.trim())
    setOpen(false)
    reset()
  }

  return (
    <GameDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
      title="新增動物"
      trigger={
        <button type="button" className="bg-ink text-parchment rounded-full px-3 py-1 text-xs">
          + 新增動物
        </button>
      }
    >
      {selectedSlug ? (
        <div>
          <p className="text-sm">
            動物：<span className="font-bold">{ANIMALS_BY_SLUG[selectedSlug]?.name}</span>
          </p>
          <input
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="幫牠取個暱稱…"
            className="border-ink/30 bg-cream mt-2 w-full rounded-full border px-3 py-1 text-sm"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!nickname.trim()}
              className="bg-ink text-parchment rounded-full px-3 py-1 text-sm disabled:opacity-40"
            >
              確認新增
            </button>
            <button
              type="button"
              onClick={() => setSelectedSlug(null)}
              className="border-ink/30 rounded-full border px-3 py-1 text-sm"
            >
              重新選擇
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋動物…"
            className="border-ink/30 bg-cream w-full rounded-full border px-3 py-1 text-sm"
          />
          <ul className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto">
            {results.map((animal) => (
              <li key={animal.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(animal.slug)}
                  className="border-ink/20 hover:bg-parchment w-full rounded-lg border px-2 py-1 text-left text-sm"
                >
                  {animal.name}（{animal.name_jp}）
                </button>
              </li>
            ))}
            {results.length === 0 ? <p className="text-ink/50 text-xs">查無符合的動物。</p> : null}
          </ul>
        </>
      )}
    </GameDialog>
  )
}

export function AnimalTracker({ save, onSave }) {
  const today = save.calendar

  function handleAdd(animalSlug, nickname) {
    onSave(addAnimal(save, animalSlug, nickname))
  }

  function handleCare(animalId) {
    onSave(careAnimalUseCase(save, animalId, today))
  }

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">畜牧追蹤</h2>
        <AddAnimalDialog onAdd={handleAdd} />
      </div>

      {save.animals.length === 0 ? (
        <p className="text-ink/50 mt-2 text-xs">尚無飼養紀錄。</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {save.animals.map((animal) => (
            <AnimalRow key={animal.id} animal={animal} today={today} onCare={handleCare} />
          ))}
        </ul>
      )}
    </section>
  )
}
