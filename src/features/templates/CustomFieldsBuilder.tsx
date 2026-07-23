import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Input, Select } from '@/components/ui/Field'
import {
  FIELD_TYPES,
  newFieldId,
  type CustomFieldDef,
} from '@/features/consultations/customFields'

/**
 * Editor de campos personalizados de una plantilla: agregar, quitar, reordenar
 * y cambiar el tipo de cada campo. Estos campos aparecerán al hacer una consulta
 * con esta plantilla.
 */
export function CustomFieldsBuilder({
  value,
  onChange,
}: {
  value: CustomFieldDef[]
  onChange: (defs: CustomFieldDef[]) => void
}) {
  const update = (id: string, patch: Partial<CustomFieldDef>) =>
    onChange(value.map((f) => (f.id === id ? { ...f, ...patch } : f)))

  const remove = (id: string) => onChange(value.filter((f) => f.id !== id))

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= value.length) return
    const next = [...value]
    const a = next[index]
    const b = next[target]
    if (!a || !b) return
    next[index] = b
    next[target] = a
    onChange(next)
  }

  const add = () =>
    onChange([...value, { id: newFieldId(), label: '', type: 'text' }])

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-content-muted">Campos personalizados</h2>
        <p className="text-xs text-content-muted">
          Campos propios que aparecerán al hacer una consulta con esta plantilla.
        </p>
      </div>

      {value.map((field, i) => (
        <div key={field.id} className="card space-y-2 p-3">
          <div className="flex items-center gap-2">
            <Input
              value={field.label}
              onChange={(e) => update(field.id, { label: e.target.value })}
              placeholder="Nombre del campo (p. ej. Lote de vacuna)"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Subir"
              className="text-content-muted disabled:opacity-30"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === value.length - 1}
              aria-label="Bajar"
              className="text-content-muted disabled:opacity-30"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => remove(field.id)}
              aria-label="Quitar campo"
              className="text-content-muted hover:text-error"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={field.type}
              onChange={(e) =>
                update(field.id, { type: e.target.value as CustomFieldDef['type'] })
              }
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 px-1 text-sm">
              <input
                type="checkbox"
                checked={Boolean(field.required)}
                onChange={(e) => update(field.id, { required: e.target.checked })}
                className="h-4 w-4"
              />
              Obligatorio
            </label>
          </div>

          {field.type === 'select' && (
            <Input
              value={(field.options ?? []).join(', ')}
              onChange={(e) =>
                update(field.id, {
                  options: e.target.value
                    .split(',')
                    .map((o) => o.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Opciones separadas por coma: Sí, No, Pendiente"
            />
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-primary hover:bg-background"
      >
        <Plus className="h-4 w-4" /> Agregar campo
      </button>
    </div>
  )
}
