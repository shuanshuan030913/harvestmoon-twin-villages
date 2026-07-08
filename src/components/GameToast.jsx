import { Toast } from 'radix-ui'

export function GameToastProvider({ children }) {
  return (
    <Toast.Provider swipeDirection="right">
      {children}
      <Toast.Viewport className="fixed right-4 bottom-4 z-50 flex w-72 flex-col gap-2 outline-none" />
    </Toast.Provider>
  )
}

export function GameToast({ open, onOpenChange, title, description }) {
  return (
    <Toast.Root
      open={open}
      onOpenChange={onOpenChange}
      className="bg-cream border-ink rounded-xl border-2 p-3 shadow-md"
    >
      <Toast.Title className="text-sm font-bold">{title}</Toast.Title>
      {description && <Toast.Description className="text-xs">{description}</Toast.Description>}
    </Toast.Root>
  )
}
