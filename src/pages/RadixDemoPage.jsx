import { useState } from 'react'
import { GameDialog } from '../components/GameDialog.jsx'
import { GameToast, GameToastProvider } from '../components/GameToast.jsx'

function RadixDemoPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

  return (
    <GameToastProvider>
      <div className="flex flex-col items-start gap-4">
        <GameDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="範例對話框"
          trigger={
            <button type="button" className="bg-ink text-parchment rounded-full px-4 py-1 text-sm">
              開啟 Dialog
            </button>
          }
        >
          <p className="text-sm">這是 GameDialog 的內容示範。</p>
        </GameDialog>

        <button
          type="button"
          onClick={() => setToastOpen(true)}
          className="bg-ink text-parchment rounded-full px-4 py-1 text-sm"
        >
          觸發 Toast
        </button>
        <GameToast
          open={toastOpen}
          onOpenChange={setToastOpen}
          title="提醒"
          description="這是 GameToast 的內容示範。"
        />
      </div>
    </GameToastProvider>
  )
}

export default RadixDemoPage
