import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl border border-docly-border bg-docly-surface p-6 shadow-[0_0_60px_rgba(255,42,42,0.12)] motion-safe:animate-[docly-modal_0.2s_ease-out]"
      >
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <div className="mt-4">{children}</div>
        {footer ?? (
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
