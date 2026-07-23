import { useEffect, useRef, useState } from 'react'
import animals from '../data/animals.json'
import { addAnimal, removeAnimal } from '../usecases/plotAnimalUseCases.js'
import { adjustTreatUseCase } from '../usecases/trackerCareUseCases.js'
import { computeTreatProgress } from '../utils/treats.js'
import { GameDialog } from './GameDialog.jsx'
import { Icon } from './icons.jsx'

const ANIMALS_BY_SLUG = Object.fromEntries(animals.map((animal) => [animal.slug, animal]))
const TREAT_TYPES = ['茶點', '野菜', '穀物', '魚味']

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
          // 垃圾桶圖示取代裸「×」＋拿掉圓形描邊（U62，2026-07-23 使用者回饋：×字
          // 容易讀成「關閉」而非「刪除」；描邊跟 GameDialog 關閉鈕同一輪一起拿掉）；
          // 熱區維持 h-8 w-8 不縮水，只是視覺上不顯示邊界。
          className="text-ink/60 hover:bg-red-50 hover:text-red-700 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        >
          <Icon id="trash" className="h-4 w-4" />
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
  const progress = definition?.treat_requirements
    ? computeTreatProgress(definition.treat_requirements, animal.treatsFed)
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
        {/* 不給每列容器——不畫框也不塗底色，純靠列間距＋固定對齊排節奏（2026-07-22
            使用者回饋：點狀分隔線＋每顆有框圓鈕疊在一起是「框中框」，換成底色分帶
            也只是換一種框，同 U36「分層靠底色深淺」原則的延伸——這裡連底色分帶都
            拿掉，因為 4 項本來就靠標籤/控制項的固定對齊分得清楚，不需要邊界線索）。
            「還差 N」是全區唯一的色塊，因為它是唯一真的在傳遞狀態的東西。
            單欄 flex-col 讓每列跨滿整張卡片寬度，label/badge 靠最左、控制項靠
            最右，中間留一大片空白讀起來吃力（U61，2026-07-23 使用者回饋）；改用
            auto-fill 網格讓欄數依卡片實際寬度自然決定——不寫死欄數斷點（那是
            CollectionEntryList 為了跨 9 個分類頁共用才寫死的作法，這裡是單一
            動物卡片內部的迷你網格，沒有共用需求）。 */}
        <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-4 gap-y-3">
          {TREAT_TYPES.map((type) => {
            if (definition?.treat_requirements?.[type] === null) return null
            const count = animal.treatsFed?.[type] ?? 0
            const shortfall = !progress?.maxed ? progress?.shortfall?.[type] : undefined
            return (
              <div key={type} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="text-sm">{type}</span>
                  {shortfall > 0 ? (
                    <span className="text-seal bg-seal/10 rounded-full px-2 py-0.5 text-xs font-bold">還差 {shortfall}</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-1.5">
                  {/* 觸控目標行動版 44px（DESIGN.md），桌機縮回滑鼠尺寸 */}
                  <button
                    type="button"
                    onClick={() => onAdjust(animal.id, type, -1)}
                    disabled={count === 0}
                    aria-label={`${type} 減 1`}
                    className="bg-ink/10 hover:bg-ink/20 h-11 w-11 rounded-full text-sm leading-none disabled:opacity-30 md:h-7 md:w-7 md:text-xs"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums">{count}</span>
                  <button
                    type="button"
                    onClick={() => onAdjust(animal.id, type, 1)}
                    aria-label={`${type} 加 1`}
                    className="btn-stamp bg-ink text-cream h-11 w-11 rounded-full text-sm leading-none md:h-7 md:w-7 md:text-xs"
                  >
                    ＋
                  </button>
                </span>
              </div>
            )
          })}
        </div>
        {progress?.maxed ? (
          <p className="text-ink/60 mt-1 text-sm">
            已達最高等級（Lv.{progress.tier}）
            <span className="text-ink/40 text-xs">（依攻略建議配方計算）</span>
          </p>
        ) : progress ? (
          <p className="text-ink/60 mt-1 text-sm">
            目前 Lv.{progress.tier}
            <span className="text-ink/40 text-xs">（湊滿當輪四類配方才會升級，「還差」已標示在對應點心旁）</span>
          </p>
        ) : null}
      </div>
    </li>
  )
}

// 選動物→取名合併單一畫面（U55，2026-07-23）：7 筆固定清單一次列完不用搜尋，
// 點選後下方暱稱欄啟用並自動聚焦，不再需要「重新選擇」——直接點清單裡別隻即可切換。
function AddAnimalDialog({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState(null)
  const [nickname, setNickname] = useState('')
  const nicknameInputRef = useRef(null)

  function reset() {
    setSelectedSlug(null)
    setNickname('')
  }

  // 選定當下 input 仍是 disabled（React 還沒重繪），focus() 對 disabled
  // 元素無效；改用 effect 等 disabled 屬性真的解除後再聚焦。
  useEffect(() => {
    if (selectedSlug) nicknameInputRef.current?.focus()
  }, [selectedSlug])

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
        <button type="button" className="btn-stamp bg-ink text-parchment rounded-full px-3 py-1 text-sm">
          + 新增動物
        </button>
      }
    >
      <ul className="max-h-64 overflow-y-auto">
        {animals.map((animal) => {
          const active = animal.slug === selectedSlug
          return (
            <li key={animal.slug} className="border-ink/25 border-b border-dotted last:border-b-0">
              <button
                type="button"
                onClick={() => setSelectedSlug(animal.slug)}
                className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
                  active ? 'bg-ink text-parchment' : 'hover:bg-parchment'
                }`}
              >
                {animal.name}（{animal.name_jp}）
              </button>
            </li>
          )
        })}
      </ul>
      <input
        ref={nicknameInputRef}
        type="text"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        disabled={!selectedSlug}
        placeholder="幫牠取個暱稱…"
        className="border-ink/30 bg-cream mt-3 w-full rounded-full border px-3 py-1 text-sm disabled:opacity-40"
      />
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selectedSlug || !nickname.trim()}
        className="btn-stamp bg-ink text-parchment mt-3 rounded-full px-3 py-1 text-sm disabled:opacity-40"
      >
        確認新增
      </button>
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="stamp">
            <Icon id="sheep" className="h-[18px] w-[18px]" />
          </span>
          <h1 className="font-hand text-xl font-bold">畜牧追蹤</h1>
        </div>
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
