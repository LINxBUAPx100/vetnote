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
import { cn } from '@/lib/cn'
import { todayInputValue } from '@/utils/format'

const baseControl =
  'w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-content-muted'

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 flex items-center justify-between text-sm font-medium">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-content-muted">{hint}</span>}
    </label>
  )
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1 text-xs text-error">
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
 * Envuelve un control de formulario asociando su <label> (htmlFor/id) y su
 * mensaje de error (aria-describedby) automáticamente. Así todos los campos
 * quedan accesibles sin repetir ids en cada llamada.
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
    return <textarea ref={ref} className={cn(baseControl, 'min-h-24 resize-y', className)} {...rest} />
  },
)

/**
 * Campo de fecha con botón "Hoy" que rellena la fecha actual con un toque.
 * Controlado: recibe `value` (yyyy-MM-dd) y notifica cambios por `onChange`.
 */
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
      <button
        type="button"
        onClick={() => onChange(todayInputValue())}
        className="shrink-0 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-primary transition-colors hover:bg-background"
      >
        Hoy
      </button>
    </div>
  )
}

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }
>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(baseControl, 'appearance-none', className)} {...rest}>
      {children}
    </select>
  )
})
