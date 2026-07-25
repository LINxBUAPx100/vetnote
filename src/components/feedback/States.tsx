import type { ReactNode } from 'react'
import { Loader2, AlertCircle, RotateCw, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-primary', className)} />
}

/** Placeholder de carga con brillo sutil (no un bloque gris muerto). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-line bg-surface',
        'after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r',
        'after:from-transparent after:via-sunken after:to-transparent after:animate-[shimmer_1.6s_infinite]',
        className,
      )}
      aria-hidden
    />
  )
}

/** Varias filas de esqueleto para listas. */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  )
}

/**
 * Estado vacío con intención: icono contenido, mensaje con jerarquía y una
 * acción primaria clara. Alineado a la izquierda (no centrado perezoso) para
 * que lea igual de bien en pantallas grandes.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="animate-fade-in rounded-card border border-dashed border-line-strong bg-surface/60 px-5 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-content-strong">{title}</h2>
          {description && (
            <p className="mt-1 max-w-md text-sm leading-relaxed text-content-muted">{description}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="animate-fade-in rounded-card border border-error/20 bg-error-soft px-4 py-3.5">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-content-strong">Algo no salió bien</p>
          <p className="mt-0.5 text-sm text-content-muted">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-error/25 bg-surface px-2.5 py-1.5 text-xs font-semibold text-error transition-all duration-200 hover:bg-error hover:text-white"
            >
              <RotateCw className="h-3.5 w-3.5" /> Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
