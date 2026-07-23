import { Field, Input, Textarea, Select, DateInput } from '@/components/ui/Field'
import type { CustomFieldDef } from './customFields'

/**
 * Renderiza los campos personalizados de una plantilla como inputs según su
 * tipo (texto, área, número, fecha, lista). Controlado por un mapa id→valor.
 */
export function CustomFieldInputs({
  defs,
  values,
  onChange,
}: {
  defs: CustomFieldDef[]
  values: Record<string, string>
  onChange: (id: string, value: string) => void
}) {
  if (defs.length === 0) return null

  return (
    <div className="space-y-3">
      {defs.map((f) => {
        const v = values[f.id] ?? ''
        const label = f.label || 'Campo'
        return (
          <Field key={f.id} label={f.required ? `${label} *` : label}>
            {f.type === 'textarea' ? (
              <Textarea value={v} onChange={(e) => onChange(f.id, e.target.value)} />
            ) : f.type === 'number' ? (
              <Input
                inputMode="decimal"
                value={v}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            ) : f.type === 'date' ? (
              <DateInput value={v} onChange={(val) => onChange(f.id, val)} />
            ) : f.type === 'select' ? (
              <Select value={v} onChange={(e) => onChange(f.id, e.target.value)}>
                <option value="">—</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            ) : (
              <Input value={v} onChange={(e) => onChange(f.id, e.target.value)} />
            )}
          </Field>
        )
      })}
    </div>
  )
}
