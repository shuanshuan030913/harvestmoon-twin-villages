import { Dialog } from 'radix-ui'

export function GameDialog({ trigger, title, children, open, onOpenChange }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="bg-ink/45 fixed inset-0 z-20" />
        <Dialog.Content className="bg-cream border-ink/80 fixed top-1/2 left-1/2 z-20 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border-[1.5px] p-4 shadow-[4px_5px_0_rgba(74,55,40,0.18)]">
          {/* 角落 × 取代原本底部實心「關閉」大按鈕（2026-07-22 使用者回饋：跟對話框
              內容自己的主要動作用同一種實心樣式，看起來像兩個平行的「完成」動作，
              其實語意相反）。退到角落當通用的「不管怎樣都能關掉」逃生艙，不跟內容
              自己的按鈕搶視覺權重；內容需要自己的取消/返回動作時，各自在 children
              裡宣告即可。裸 × 不描邊（U62，2026-07-23 使用者回饋：一般 popup UI
              關閉鈕多半不畫框，圓形描邊反而顯眼），熱區維持 h-8 w-8 不縮水，只是
              視覺上不顯示邊界，靠 hover 底色提示可點。 */}
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="關閉"
              className="text-ink/60 hover:bg-parchment absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-sm leading-none"
            >
              ×
            </button>
          </Dialog.Close>
          <Dialog.Title className="font-hand text-lg font-bold pr-8">{title}</Dialog.Title>
          <div className="mt-2">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
