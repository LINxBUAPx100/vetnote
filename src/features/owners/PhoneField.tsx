import { Input } from '@/components/ui/Field'
import { splitPhone } from '@/utils/format'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Lada por defecto cuando el número no trae una (México: 52). */
  defaultCode?: string
  autoFocus?: boolean
  placeholder?: string
}

/**
 * Campo de teléfono con lada editable. La lada +52 viene predeterminada pero se
 * puede cambiar. Guarda el valor como "+<lada> <número>".
 */
export function PhoneField({
  value,
  onChange,
  defaultCode = '52',
  autoFocus,
  placeholder = '282 107 5306',
}: Props) {
  const parsed = splitPhone(value)
  const code = parsed.code || defaultCode
  const local = parsed.local

  const emit = (nextCode: string, nextLocal: string) => {
    const c = nextCode.replace(/\D/g, '')
    const l = nextLocal.replace(/\D/g, '')
    onChange(l ? `+${c || defaultCode} ${l}` : '')
  }

  return (
    <div className="flex gap-2">
      <div className="flex w-20 shrink-0 items-center rounded-xl border border-border bg-surface px-2">
        <span className="text-content-muted">+</span>
        <input
          value={code}
          onChange={(e) => emit(e.target.value, local)}
          inputMode="numeric"
          aria-label="Lada de país"
          className="w-full bg-transparent px-1 py-2.5 text-sm outline-none"
        />
      </div>
      <Input
        value={local}
        onChange={(e) => emit(code, e.target.value)}
        inputMode="tel"
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="flex-1"
      />
    </div>
  )
}
