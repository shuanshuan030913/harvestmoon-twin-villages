import { Dialog } from 'radix-ui'

export function GameDialog({ trigger, title, children, open, onOpenChange }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="bg-ink/45 fixed inset-0 z-20" />
        <Dialog.Content className="bg-cream border-ink/80 fixed top-1/2 left-1/2 z-20 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border-[1.5px] p-4 shadow-[4px_5px_0_rgba(74,55,40,0.18)]">
          <Dialog.Title className="font-hand text-lg font-bold">{title}</Dialog.Title>
          <div className="mt-2">{children}</div>
          <Dialog.Close asChild>
            <button
              type="button"
              className="bg-ink text-parchment mt-4 rounded-full px-4 py-1 text-sm"
            >
              關閉
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
