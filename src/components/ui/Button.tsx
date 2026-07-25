import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'ghost' | 'plain' | 'subtle' | 'danger' | 'dangerSubtle'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

/**
 * Superficies planas separadas por borde (sin sombras pesadas) y transiciones
 * suaves en hover/active. El foco usa el anillo global definido en index.css.
 */
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-xs',
  /** Secundario con borde: la acción acompañante habitual. */
  ghost:
    'border border-line bg-surface text-content-strong hover:border-line-strong hover:bg-sunken/60 active:bg-sunken',
  /** Sin borde ni fondo: acciones terciarias dentro de una superficie. */
  plain: 'text-content-muted hover:bg-sunken hover:text-content-strong active:bg-sunken',
  subtle: 'bg-primary-50 text-primary-600 hover:bg-primary-100 active:bg-primary-200',
  danger: 'bg-error text-white hover:brightness-110 active:brightness-95 shadow-xs',
  /** Destructivo de página: discreto hasta que se posa el cursor. */
  dangerSubtle:
    'border border-error/20 bg-surface text-error hover:bg-error hover:text-white active:brightness-95',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-[34px] gap-1.5 rounded-lg px-2.5 text-xs',
  md: 'min-h-touch gap-2 rounded-xl px-4 text-sm',
  lg: 'min-h-[52px] gap-2 rounded-xl px-5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50',
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
      {children}
    </button>
  )
})

/** Botón de icono cuadrado (barras de herramientas, encabezados). */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(function IconButton({ label, className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-content-muted transition-all duration-200 hover:bg-sunken hover:text-content-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
