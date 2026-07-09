import { useState } from 'react'
import crops from '../data/crops.json'
import { addPlot } from '../usecases/plotAnimalUseCases.js'
import { computeHarvestCountdown } from '../utils/tracker.js'
import { parseGrowDays } from '../utils/growDays.js'
import { searchEntries } from '../utils/search.js'
import { GameDialog } from './GameDialog.jsx'

const CROPS_BY_SLUG = Object.fromEntries(crops.map((crop) => [crop.slug, crop]))

function PlotRow({ plot }) {
  const crop = CROPS_BY_SLUG[plot.cropSlug]
  const cropName = crop?.name ?? plot.cropSlug
  const range = crop ? parseGrowDays(crop.grow_days) : null
  const countdown = range ? computeHarvestCountdown(range, plot.wateredDays) : null

  return (
    <li className="border-ink/20 bg-cream rounded-xl border p-2 text-sm">
      <p className="font-bold">{cropName}</p>
      {plot.status === 'harvested' ? (
        <p className="text-ink/50 mt-0.5 text-xs">已收成</p>
      ) : countdown && countdown.readiness === 'ready' ? (
        <p className="mt-0.5 text-xs text-green-700">可以收成了</p>
      ) : countdown ? (
        <p className="text-ink/60 mt-0.5 text-xs">
          最快還需 {countdown.minDaysLeft} 天／最慢 {countdown.maxDaysLeft} 天
        </p>
      ) : null}
    </li>
  )
}

function AddPlotDialog({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const results = query.trim() ? searchEntries(crops, query, ['name', 'name_jp']) : crops

  function handlePick(cropSlug) {
    onAdd(cropSlug)
    setOpen(false)
    setQuery('')
  }

  return (
    <GameDialog
      open={open}
      onOpenChange={setOpen}
      title="新增種植"
      trigger={
        <button type="button" className="bg-ink text-parchment rounded-full px-3 py-1 text-xs">
          + 新增作物
        </button>
      }
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="搜尋作物…"
        className="border-ink/30 bg-cream w-full rounded-full border px-3 py-1 text-sm"
      />
      <ul className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto">
        {results.map((crop) => (
          <li key={crop.slug}>
            <button
              type="button"
              onClick={() => handlePick(crop.slug)}
              className="border-ink/20 hover:bg-parchment w-full rounded-lg border px-2 py-1 text-left text-sm"
            >
              {crop.name}（{crop.name_jp}）
            </button>
          </li>
        ))}
        {results.length === 0 ? <p className="text-ink/50 text-xs">查無符合的作物。</p> : null}
      </ul>
    </GameDialog>
  )
}

export function PlantingTracker({ save, onSave }) {
  function handleAdd(cropSlug) {
    onSave(addPlot(save, cropSlug, save.calendar))
  }

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">種植追蹤</h2>
        <AddPlotDialog onAdd={handleAdd} />
      </div>

      {save.plots.length === 0 ? (
        <p className="text-ink/50 mt-2 text-xs">尚無種植紀錄。</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {save.plots.map((plot) => (
            <PlotRow key={plot.id} plot={plot} />
          ))}
        </ul>
      )}
    </section>
  )
}
