import { useState } from 'react'
import animals from '../data/animals.json'
import { addAnimal, removeAnimal } from '../usecases/plotAnimalUseCases.js'
import { adjustTreatUseCase } from '../usecases/trackerCareUseCases.js'
import { searchEntries } from '../utils/search.js'
import { computeTreatShortfall } from '../utils/treats.js'
import { GameDialog } from './GameDialog.jsx'

const ANIMALS_BY_SLUG = Object.fromEntries(animals.map((animal) => [animal.slug, animal]))
const TREAT_TYPES = ['茶點', '野菜', '穀物', '魚味']

function formatUpdatedAt(isoString) {
  if (!isoString) return '尚無編輯紀錄'
  const date = new Date(isoString)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

function DeleteAnimalDialog({ nickname, onConfirm }) {
  const [open, setOpen] = useState(false)

  return (
    <GameDialog
      open={open}
      onOpenChange={setOpen}
      title="確認刪除"
      trigger={
        <button
          type="button"
          aria-label={`刪除 ${nickname}`}
          className="border-ink/30 text-ink/60 hover:bg-red-50 hover:border-red-700 hover:text-red-700 h-8 w-8 shrink-0 rounded-full border text-sm leading-none"
        >
          ×
        </button>
      }
    >
      <p className="text-sm">
        確定要刪除「<span className="font-bold">{nickname}</span>」的飼養紀錄嗎？此動作無法復原。
      </p>
      <button
        type="button"
        onClick={() => {
          onConfirm()
          setOpen(false)
        }}
        className="mt-3 rounded-full border border-red-700 bg-red-700 px-3 py-1 text-sm text-white"
      >
        確認刪除
      </button>
    </GameDialog>
  )
}

// 無日期點心累計器（2026-07-14 使用者裁決）：+1 記餵食、− 復原誤觸。
// 「每日限 1」是遊戲內規則，玩家在遊戲中遵守，這裡只負責記帳。
function AnimalRow({ animal, onAdjust, onRemove }) {
  const definition = ANIMALS_BY_SLUG[animal.animalSlug]
  const speciesName = definition?.name ?? `未知條目（${animal.animalSlug}）`
  const shortfall = definition?.treat_requirements
    ? computeTreatShortfall(definition.treat_requirements, animal.treatsFed)
    : null

  return (
    <li className="sticker p-3 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <p className="font-hand text-base font-bold">{animal.nickname}</p>
          <p className="text-ink/50 text-sm">{speciesName}</p>
        </div>
        <DeleteAnimalDialog nickname={animal.nickname} onConfirm={() => onRemove(animal.id)} />
      </div>

      <div className="mt-2">
        <p className="text-ink/60 text-sm font-bold">點心累計</p>
        <div className="mt-1 flex flex-col">
          {TREAT_TYPES.map((type) => {
            if (shortfall && !(type in shortfall)) return null
            const count = animal.treatsFed?.[type] ?? 0
            return (
              <div key={type} className="border-ink/40 flex items-center justify-between gap-2 border-b-[1.5px] border-dotted py-1 last:border-b-0">
                <span className="text-sm">{type}</span>
                <span className="flex items-center gap-1.5">
                  {/* 觸控目標行動版 44px（DESIGN.md），桌機縮回滑鼠尺寸 */}
                  <button
                    type="button"
                    onClick={() => onAdjust(animal.id, type, -1)}
                    disabled={count === 0}
                    aria-label={`${type} 減 1`}
                    className="border-ink/40 bg-cream hover:bg-parchment h-11 w-11 rounded-full border text-sm leading-none disabled:opacity-30 md:h-7 md:w-7 md:text-xs"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums">{count}</span>
                  <button
                    type="button"
                    onClick={() => onAdjust(animal.id, type, 1)}
                    aria-label={`${type} 加 1`}
                    className="bg-ink text-cream border-ink h-11 w-11 rounded-full border text-sm leading-none md:h-7 md:w-7 md:text-xs"
                  >
                    ＋
                  </button>
                </span>
              </div>
            )
          })}
        </div>
        {shortfall ? (
          <p className="text-ink/60 mt-1 text-sm">
            還差：
            {Object.entries(shortfall)
              .map(([type, amount]) => `${type}${amount}`)
              .join('、')}
            <span className="text-ink/40 text-xs">（依攻略建議配方計算）</span>
          </p>
        ) : null}
      </div>
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
        <button type="button" className="bg-ink text-parchment rounded-full px-3 py-1 text-sm">
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
            {results.length === 0 ? <p className="text-ink/50 text-sm">查無符合的動物。</p> : null}
          </ul>
        </>
      )}
    </GameDialog>
  )
}

export function AnimalTracker({ save, onSave }) {
  function handleAdd(animalSlug, nickname) {
    onSave(addAnimal(save, animalSlug, nickname))
  }

  function handleAdjust(animalId, treatType, delta) {
    onSave(adjustTreatUseCase(save, animalId, treatType, delta))
  }

  function handleRemove(animalId) {
    onSave(removeAnimal(save, animalId))
  }

  return (
    <section className="mt-4">
      <p className="text-ink/50 text-xs">最後編輯：{formatUpdatedAt(save.animalsUpdatedAt)}</p>
      <div className="mt-1 flex items-center justify-between">
        <h2 className="font-hand text-base font-bold">畜牧追蹤</h2>
        <AddAnimalDialog onAdd={handleAdd} />
      </div>

      {save.animals.length === 0 ? (
        <p className="text-ink/50 mt-2 text-sm">尚無飼養紀錄。</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {save.animals.map((animal) => (
            <AnimalRow key={animal.id} animal={animal} onAdjust={handleAdjust} onRemove={handleRemove} />
          ))}
        </ul>
      )}
    </section>
  )
}
