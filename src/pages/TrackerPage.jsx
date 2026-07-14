import { useState } from 'react'
import characters from '../data/characters.json'
import festivals from '../data/festivals.json'
import { AnimalTracker } from '../components/AnimalTracker.jsx'
import { ExportImportSection } from '../components/ExportImportSection.jsx'
import { GameToast, GameToastProvider } from '../components/GameToast.jsx'
import { advanceDayUseCase } from '../usecases/advanceDayUseCase.js'
import { createEmptySave } from '../utils/save.js'
import { loadSaveWithMigration, saveSave } from '../utils/storage.js'

function TrackerPage() {
  const [save, setSave] = useState(() => loadSaveWithMigration().save)
  const [toast, setToast] = useState({ open: false, title: '', description: '' })
  const [saveFailed, setSaveFailed] = useState(false)

  function persist(newSave) {
    const result = saveSave(newSave)
    setSaveFailed(!result.ok)
    setSave(newSave)
  }

  function handleStart() {
    persist(createEmptySave())
  }

  function handleAdvance() {
    const { save: nextSave, reminders } = advanceDayUseCase(save, { characters, festivals })
    persist(nextSave)

    const names = [...reminders.characters.map((c) => c.name), ...reminders.festivals.map((f) => f.name)]
    if (names.length > 0) {
      setToast({ open: true, title: '今日提醒', description: names.map((name) => `🎂 ${name}`).join('、') })
    }
  }

  return (
    <GameToastProvider>
      <h1 className="text-lg font-bold">追蹤器</h1>

      {saveFailed ? (
        <div className="mt-3 rounded-2xl border-2 border-red-700 bg-red-50 p-3 text-sm text-red-700">
          存檔寫入失敗（可能是儲存空間不足或瀏覽器隱私模式），目前的變更僅暫存於本次瀏覽，重新整理將會遺失。
        </div>
      ) : null}

      {save === null ? (
        <div className="mt-3">
          <p className="text-ink/60 text-sm">尚未建立存檔。</p>
          <button
            type="button"
            onClick={handleStart}
            className="bg-ink text-parchment mt-2 rounded-full px-4 py-2 text-sm"
          >
            開始新遊戲
          </button>
        </div>
      ) : (
        <div className="border-ink/20 bg-cream mt-3 flex items-center justify-between rounded-2xl border-2 p-3">
          <p className="text-sm font-bold">
            第 {save.calendar.year} 年 {save.calendar.season} {save.calendar.day} 日
          </p>
          <button
            type="button"
            onClick={handleAdvance}
            className="bg-ink text-parchment rounded-full px-4 py-1 text-sm"
          >
            過一天
          </button>
        </div>
      )}

      {/* 種植追蹤（PlantingTracker）與收集清單（ChecklistsSection）已停用
          （2026-07-14 使用者裁決），存檔資料結構保留 */}
      {save !== null ? <AnimalTracker save={save} onSave={persist} /> : null}
      {save !== null ? <ExportImportSection save={save} onSave={setSave} /> : null}

      <GameToast
        open={toast.open}
        onOpenChange={(open) => setToast((current) => ({ ...current, open }))}
        title={toast.title}
        description={toast.description}
      />
    </GameToastProvider>
  )
}

export default TrackerPage
