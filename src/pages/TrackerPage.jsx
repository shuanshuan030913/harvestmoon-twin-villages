import { useState } from 'react'
import { AnimalTracker } from '../components/AnimalTracker.jsx'
import { ExportImportSection } from '../components/ExportImportSection.jsx'
import { createEmptySave } from '../utils/save.js'
import { loadSaveWithMigration, saveSave } from '../utils/storage.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

// 虛擬遊戲日曆（HUD/過一天/今日提醒 Toast）已整組停用（2026-07-14 使用者
// 裁決：依賴玩家逐日手動同步不現實，漂移後的提醒比沒有提醒更糟）。存檔仍
// 保留 calendar 欄位不動；追蹤器現為無日期的點心累計器＋匯出/匯入。
// 種植追蹤（PlantingTracker）與收集清單（ChecklistsSection）同前已停用。
function TrackerPage() {
  useDocumentTitle('存檔')
  const [save, setSave] = useState(() => loadSaveWithMigration().save ?? createEmptySave())
  const [saveFailed, setSaveFailed] = useState(false)

  function persist(newSave) {
    const result = saveSave(newSave)
    setSaveFailed(!result.ok)
    setSave(newSave)
  }

  return (
    <>
      {/* 頁面級「存檔」標題移除（2026-07-22 使用者回饋：跟上方 tab 已選中的
          「存檔」複讀，資訊量為零）；AnimalTracker 的「畜牧追蹤」升格為本頁
          唯一的 h1，tab 已經負責「你在存檔頁」這件事，標題不用再講一次。 */}
      {saveFailed ? (
        <div className="mt-3 rounded-2xl border-2 border-red-700 bg-red-50 p-3 text-sm text-red-700">
          存檔寫入失敗（可能是儲存空間不足或瀏覽器隱私模式），目前的變更僅暫存於本次瀏覽，重新整理將會遺失。
        </div>
      ) : null}

      <AnimalTracker save={save} onSave={persist} />
      <ExportImportSection save={save} onSave={setSave} />
    </>
  )
}

export default TrackerPage
