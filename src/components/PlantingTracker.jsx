import { useState } from 'react'
import crops from '../data/crops.json'
import { addPlot, harvestPlotUseCase } from '../usecases/plotAnimalUseCases.js'
import { computeHarvestCountdown } from '../utils/tracker.js'
import { diffDays } from '../utils/gameCalendar.js'
import { parseGrowDays } from '../utils/growDays.js'
import { searchEntries } from '../utils/search.js'
import { GameDialog } from './GameDialog.jsx'

const CROPS_BY_SLUG = Object.fromEntries(crops.map((crop) => [crop.slug, crop]))

function PlotRow({ plot, today, onHarvest }) {
  const crop = CROPS_BY_SLUG[plot.cropSlug]
  const cropName = crop?.name ?? `未知條目（${plot.cropSlug}）`
  const range = crop ? parseGrowDays(crop.grow_days) : null
  // 澆水記錄已停用（2026-07-14 使用者裁決），倒數改依種植起算的經過天數
  const daysElapsed = plot.plantedOn ? Math.max(0, diffDays(plot.plantedOn, today)) : 0
  const countdown = range ? computeHarvestCountdown(range, daysElapsed) : null
  const canHarvest = countdown && countdown.readiness !== 'growing'

  if (plot.status === 'harvested') {
    return (
      <li className="border-ink/20 bg-cream rounded-xl border p-2 text-sm">
        <p className="font-bold">{cropName}</p>
        <p className="text-ink/50 mt-0.5 text-xs">已收成</p>
      </li>
    )
  }

  return (
    <li className="border-ink/20 bg-cream rounded-xl border p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">{cropName}</p>
        {canHarvest ? (
          <button
            type="button"
            onClick={() => onHarvest(plot.id)}
            className="shrink-0 rounded-full border border-green-700 bg-green-700 px-2 py-0.5 text-xs text-white"
          >
            收成
          </button>
        ) : null}
      </div>
      {countdown && countdown.readiness === 'ready' ? (
        <p className="mt-0.5 text-xs text-green-700">可以收成了</p>
      ) : countdown && countdown.readiness === 'maybeReady' ? (
        <p className="mt-0.5 text-xs text-green-700">可能已可收成（依鋤頭等級而異）</p>
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
  const today = save.calendar
  const activePlots = save.plots.filter((plot) => plot.status !== 'harvested')
  const historyPlots = save.plots.filter((plot) => plot.status === 'harvested')

  function handleAdd(cropSlug) {
    onSave(addPlot(save, cropSlug, today))
  }

  function handleHarvest(plotId) {
    onSave(harvestPlotUseCase(save, plotId, crops, today))
  }

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">種植追蹤</h2>
        <AddPlotDialog onAdd={handleAdd} />
      </div>

      {activePlots.length === 0 ? (
        <p className="text-ink/50 mt-2 text-xs">尚無種植紀錄。</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {activePlots.map((plot) => (
            <PlotRow key={plot.id} plot={plot} today={today} onHarvest={handleHarvest} />
          ))}
        </ul>
      )}

      {historyPlots.length > 0 ? (
        <details className="mt-3">
          <summary className="text-ink/60 cursor-pointer text-xs font-bold">歷史（已收成）</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {historyPlots.map((plot) => (
              <PlotRow key={plot.id} plot={plot} today={today} onHarvest={handleHarvest} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}
