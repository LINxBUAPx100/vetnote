import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const styles: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-[0_6px_16px_rgba(58,143,224,0.32)] hover:brightness-105 active:brightness-95',
  ghost: 'border border-border bg-surface text-content hover:bg-background',
  danger: 'bg-error text-white hover:opacity-90',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex min-h-touch items-center justify-center gap-2 rounded-2xl px-4 font-semibold transition-all disabled:opacity-50',
        styles[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
