import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useUiStore, type ToastKind } from '@/stores/uiStore'
import { cn } from '@/lib/cn'

const icons: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}
const colors: Record<ToastKind, string> = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-secondary',
}

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {toasts.map((t) => {
        const Icon = icons[t.kind]
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border border-border bg-surface p-3 shadow-floating"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', colors[t.kind])} />
            <p className="flex-1 text-sm">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-content-muted hover:text-content"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
