import { useState } from 'react'
import characters from '../data/characters.json'
import festivals from '../data/festivals.json'
import { AnimalTracker } from '../components/AnimalTracker.jsx'
import { ChecklistsSection } from '../components/ChecklistsSection.jsx'
import { GameToast, GameToastProvider } from '../components/GameToast.jsx'
import { PlantingTracker } from '../components/PlantingTracker.jsx'
import { advanceDayUseCase } from '../usecases/advanceDayUseCase.js'
import { createEmptySave } from '../utils/save.js'
import { loadSaveWithMigration, saveSave } from '../utils/storage.js'

function TrackerPage() {
  const [save, setSave] = useState(() => loadSaveWithMigration().save)
  const [toast, setToast] = useState({ open: false, title: '', description: '' })

  function handleStart() {
    const newSave = createEmptySave()
    saveSave(newSave)
    setSave(newSave)
  }

  function handleAdvance() {
    const { save: nextSave, reminders } = advanceDayUseCase(save, { characters, festivals })
    setSave(nextSave)

    const names = [...reminders.characters.map((c) => c.name), ...reminders.festivals.map((f) => f.name)]
    if (names.length > 0) {
      setToast({ open: true, title: '今日提醒', description: names.map((name) => `🎂 ${name}`).join('、') })
    }
  }

  return (
    <GameToastProvider>
      <h1 className="text-lg font-bold">追蹤器</h1>

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

      {save !== null ? <PlantingTracker save={save} onSave={setSave} /> : null}
      {save !== null ? <AnimalTracker save={save} onSave={setSave} /> : null}
      {save !== null ? <ChecklistsSection save={save} onSave={setSave} /> : null}

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
