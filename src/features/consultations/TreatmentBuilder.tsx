import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Pill, Search } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { medicationService } from '@/services/catalogService'
import { formatTreatmentItem, type TreatmentItem } from './treatment'
import type { Medication } from '@/types/domain'

interface Props {
  items: TreatmentItem[]
  onChange: (items: TreatmentItem[]) => void
}

/**
 * Constructor de tratamiento: selecciona medicamentos del catálogo (o escribe
 * uno libre), con dosis, vía, frecuencia, duración y comentarios. Ningún campo
 * es obligatorio salvo el nombre. La lista resultante se guarda estructurada y
 * también se vuelca a texto para la nota e imagen.
 */
export function TreatmentBuilder({ items, onChange }: Props) {
  const meds = useQuery({ queryKey: ['medications'], queryFn: () => medicationService.list() })
  const [query, setQuery] = useState('')

  const catalog = meds.data?.results ?? []
  const filtered = query.trim()
    ? catalog.filter((m) =>
        [m.generic_name, m.commercial_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : catalog

  const addFromMed = (m: Medication) => {
    onChange([
      ...items,
      {
        name: m.generic_name,
        medication_id: m.medication_id,
        route: m.route || undefined,
        notes: m.default_instructions || undefined,
      },
    ])
    setQuery('')
  }

  const addFree = () => {
    const name = query.trim()
    onChange([...items, name ? { name } : { name: '' }])
    setQuery('')
  }

  const update = (index: number, patch: Partial<TreatmentItem>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))

  return (
    <div className="space-y-3">
      {/* Buscador / alta de medicamento */}
      <div>
        <label className="flex min-h-touch items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search className="h-5 w-5 text-content-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar o escribir medicamento…"
            className="border-0 bg-transparent px-0 focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addFree()
              }
            }}
          />
          <button
            type="button"
            onClick={addFree}
            className="chip shrink-0"
            aria-label="Agregar medicamento escrito"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </label>

        {query.trim() && filtered.length > 0 && (
          <ul className="mt-1 max-h-48 space-y-1 overflow-auto rounded-xl border border-border bg-surface p-1">
            {filtered.slice(0, 8).map((m) => (
              <li key={m.medication_id}>
                <button
                  type="button"
                  onClick={() => addFromMed(m)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-background"
                >
                  <Pill className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="font-medium">{m.generic_name}</span>
                    {(m.commercial_name || m.concentration) && (
                      <span className="text-content-muted">
                        {' '}
                        · {[m.commercial_name, m.concentration].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ítems agregados */}
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-content-muted">
          Sin medicamentos. Busca en el catálogo o escribe uno para agregarlo.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="rounded-xl border border-border bg-surface p-3">
              <div className="mb-2 flex items-center gap-2">
                <Pill className="h-4 w-4 shrink-0 text-primary" />
                <Input
                  value={it.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="Medicamento"
                  className="flex-1 font-medium"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Quitar medicamento"
                  className="shrink-0 text-content-muted hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={it.dose ?? ''}
                  onChange={(e) => update(i, { dose: e.target.value })}
                  placeholder="Dosis (1 tab)"
                />
                <Input
                  value={it.route ?? ''}
                  onChange={(e) => update(i, { route: e.target.value })}
                  placeholder="Vía (VO, IM…)"
                />
                <Input
                  value={it.frequency ?? ''}
                  onChange={(e) => update(i, { frequency: e.target.value })}
                  placeholder="Frecuencia (c/8 h)"
                />
                <Input
                  value={it.duration ?? ''}
                  onChange={(e) => update(i, { duration: e.target.value })}
                  placeholder="Duración (7 días)"
                />
              </div>
              <Input
                value={it.notes ?? ''}
                onChange={(e) => update(i, { notes: e.target.value })}
                placeholder="Comentarios / indicaciones"
                className="mt-2"
              />
              <p className="mt-2 text-xs text-content-muted">{formatTreatmentItem(it)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
