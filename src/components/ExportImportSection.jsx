import { useRef, useState } from 'react'
import { exportSave, importSave, restoreBackup } from '../utils/exportImport.js'
import { loadSave } from '../utils/storage.js'
import { formatUpdatedAt } from '../utils/formatDate.js'
import { Icon } from './icons.jsx'

const ERROR_MESSAGES = {
  'parse-failed': '檔案不是合法的 JSON。',
  invalid: '檔案內容不是合法的存檔格式。',
  'write-failed': '寫入失敗（可能是儲存空間不足）。',
  'no-backup': '目前沒有可還原的備份。',
}

export function ExportImportSection({ save, onSave }) {
  const fileInputRef = useRef(null)
  const [message, setMessage] = useState(null)

  function handleExport() {
    exportSave(save)
    setMessage({ type: 'ok', text: '已下載存檔檔案。' })
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = importSave(String(reader.result))
      if (result.ok) {
        onSave(loadSave().save)
        setMessage({ type: 'ok', text: '已匯入，可用下方按鈕還原到匯入前的存檔。' })
      } else {
        setMessage({ type: 'error', text: ERROR_MESSAGES[result.error] ?? '匯入失敗。' })
      }
    }
    reader.readAsText(file)
  }

  function handleRestore() {
    const result = restoreBackup()
    if (result.ok) {
      onSave(loadSave().save)
      setMessage({ type: 'ok', text: '已還原到匯入前的存檔。' })
    } else {
      setMessage({ type: 'error', text: ERROR_MESSAGES[result.error] ?? '還原失敗。' })
    }
  }

  return (
    <section className="mt-4">
      <div className="flex items-center gap-2.5">
        <span className="stamp">
          <Icon id="save" className="h-[18px] w-[18px]" />
        </span>
        <h2 className="font-hand text-base font-bold">匯出／匯入</h2>
      </div>
      {/* 「最後編輯」原本擠在頁面最上方、比玩家真正要看的內容還優先（2026-07-22
          使用者回饋）；這裡才是它真正有意義的位置——決定要不要下載備份前，
          最相關的資訊就是「上次存檔是什麼時候」。 */}
      <p className="text-ink/50 mt-1 text-xs">最後編輯：{formatUpdatedAt(save.animalsUpdatedAt)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="btn-stamp bg-ink text-parchment rounded-full px-3 py-1 text-sm"
        >
          下載存檔
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="btn-stamp border-ink/30 bg-cream rounded-full border px-3 py-1 text-sm"
        >
          選擇檔案匯入
        </button>
        <button
          type="button"
          onClick={handleRestore}
          className="btn-stamp border-ink/30 bg-cream rounded-full border px-3 py-1 text-sm"
        >
          還原匯入前備份
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {message ? (
        <p className={`mt-2 text-sm ${message.type === 'error' ? 'text-red-700' : 'text-ink/60'}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  )
}
