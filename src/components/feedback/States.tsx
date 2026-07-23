import type { ReactNode } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-primary', className)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-border/50', className)} aria-hidden />
}

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
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="max-w-xs text-sm text-content-muted">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card p-4 text-sm">
      <p className="text-error">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 font-medium text-primary underline">
          Reintentar
        </button>
      )}
    </div>
  )
}
