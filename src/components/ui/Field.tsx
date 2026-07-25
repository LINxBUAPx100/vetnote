import {
  forwardRef,
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  todayInputValue,
  toDateTimeLocalValue,
  fromDateTimeLocalValue,
  nowDateTimeLocalValue,
} from '@/utils/format'

/**
 * Controles con borde sutil, foco explícito (borde + anillo) y transición
 * suave. Sin sombras internas ni bordes gruesos.
 */
const baseControl =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-content-strong outline-none transition-all duration-200 placeholder:text-content-subtle hover:border-line-strong focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-sunken disabled:text-content-muted'

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: ReactNode
  htmlFor?: string
  hint?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold text-content-strong"
    >
      <span>{children}</span>
      {hint && <span className="text-2xs font-normal text-content-subtle">{hint}</span>}
    </label>
  )
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 text-xs font-medium text-error">
      {message}
    </p>
  )
}

interface FieldProps {
  label?: string
  error?: string
  hint?: string
  children: ReactNode
  id?: string
}

/**
 * Envuelve un control asociando su <label> (htmlFor/id) y su mensaje de error
 * (aria-describedby) automáticamente.
 */
export function Field({ label, error, hint, children, id }: FieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = `${fieldId}-error`

  const control =
    isValidElement(children) && (children.props as { id?: string }).id === undefined
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          id: fieldId,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? errorId : undefined,
        })
      : children

  return (
    <div>
      {label && (
        <Label htmlFor={fieldId} hint={hint}>
          {label}
        </Label>
      )}
      {control}
      <FieldError id={errorId} message={error} />
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(baseControl, className)} {...rest} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(baseControl, 'min-h-24 resize-y leading-relaxed', className)}
        {...rest}
      />
    )
  },
)

/** Botón auxiliar de los campos de fecha ("Hoy" / "Ahora"). */
function FieldAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-primary transition-all duration-200 hover:border-primary-200 hover:bg-primary-50"
    >
      {children}
    </button>
  )
}

/** Campo de fecha con botón "Hoy" que rellena la fecha actual con un toque. */
export function DateInput({
  value,
  onChange,
  id,
  ...rest
}: {
  value: string
  onChange: (value: string) => void
  id?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  return (
    <div className="flex gap-2">
      <Input
        type="date"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
        {...rest}
      />
      <FieldAction onClick={() => onChange(todayInputValue())}>Hoy</FieldAction>
    </div>
  )
}

/**
 * Campo de fecha y hora con botón "Ahora". Trabaja con ISO hacia afuera y con
 * `datetime-local` por dentro.
 */
export function DateTimeInput({
  value,
  onChange,
  id,
  ...rest
}: {
  value: string
  onChange: (isoValue: string) => void
  id?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  return (
    <div className="flex gap-2">
      <Input
        type="datetime-local"
        id={id}
        value={toDateTimeLocalValue(value)}
        onChange={(e) => onChange(fromDateTimeLocalValue(e.target.value))}
        className="flex-1"
        {...rest}
      />
      <FieldAction onClick={() => onChange(fromDateTimeLocalValue(nowDateTimeLocalValue()))}>
        Ahora
      </FieldAction>
    </div>
  )
}

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }
>(function Select({ className, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(baseControl, 'appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle"
        aria-hidden
      />
    </div>
  )
})

/** Campo de búsqueda con icono integrado, sin doble borde. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label: string
  autoFocus?: boolean
}) {
  return (
    <div className="group relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle transition-colors duration-200 group-focus-within:text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        className={cn(baseControl, 'pl-9 [&::-webkit-search-cancel-button]:appearance-none')}
      />
    </div>
  )
}
