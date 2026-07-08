import { Dialog } from 'radix-ui'

export function GameDialog({ trigger, title, children, open, onOpenChange }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="bg-cream border-ink fixed top-1/2 left-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 p-4 shadow-lg">
          <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
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
