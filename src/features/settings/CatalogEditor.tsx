import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, RotateCcw, Search } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { settingsService } from '@/services/catalogService'
import { useSettings } from '@/features/consultations/hooks'
import { toast } from '@/stores/uiStore'
import { cn } from '@/lib/cn'
import type { ClinicSettings } from '@/types/domain'
import {
  CATALOG_META,
  resolveCatalog,
  addEntry,
  removeEntry,
  restoreBase,
  hiddenCount,
  isBaseEntry,
  type CatalogKind,
} from './catalogPrefs'

const TABS: CatalogKind[] = ['dog_breeds', 'cat_breeds', 'colors']

/**
 * Administra las listas de razas y colores: añadir entradas propias y quitar
 * las que no se usan. Quitar una entrada base solo la oculta, así que siempre
 * se puede restaurar.
 */
export function CatalogEditor() {
  const qc = useQueryClient()
  const settings = useSettings()
  const [kind, setKind] = useState<CatalogKind>('dog_breeds')
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState('')

  const save = useMutation({
    mutationFn: (patch: Partial<ClinicSettings>) => settingsService.update(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
    onError: (e) => toast.error((e as Error).message),
  })

  const list = useMemo(
    () => resolveCatalog(kind, settings.data),
    [kind, settings.data],
  )
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return q ? list.filter((v) => v.toLowerCase().includes(q)) : list
  }, [list, filter])

  const hidden = hiddenCount(kind, settings.data)
  const meta = CATALOG_META[kind]

  const add = () => {
    const value = draft.trim()
    if (!value) return
    if (list.some((v) => v.toLowerCase() === value.toLowerCase())) {
      toast.info('Ya está en la lista')
      setDraft('')
      return
    }
    const patch = addEntry(kind, value, settings.data)
    if (Object.keys(patch).length) save.mutate(patch)
    setDraft('')
  }

  const remove = (value: string) => {
    const patch = removeEntry(kind, value, settings.data)
    if (Object.keys(patch).length) save.mutate(patch)
  }

  return (
    <div>
      {/* Selector de lista */}
      <div className="mb-4 inline-flex rounded-lg border border-line bg-surface p-0.5">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k)
              setFilter('')
            }}
            aria-pressed={kind === k}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200',
              kind === k
                ? 'bg-primary-50 text-primary-600'
                : 'text-content-muted hover:text-content-strong',
            )}
          >
            {CATALOG_META[k].label}
          </button>
        ))}
      </div>

      <p className="mb-3 text-xs text-content-muted">{meta.hint}</p>

      {/* Añadir */}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={kind === 'colors' ? 'Añadir color…' : 'Añadir raza…'}
          aria-label={`Añadir a ${meta.label}`}
          autoComplete="off"
        />
        <Button onClick={add} disabled={!draft.trim()} className="shrink-0 px-3">
          <Plus className="h-4 w-4" strokeWidth={2.25} /> Añadir
        </Button>
      </div>

      {/* Buscar dentro de la lista (son listas largas) */}
      {list.length > 12 && (
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-subtle"
            aria-hidden
          />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar la lista…"
            aria-label="Filtrar la lista"
            autoComplete="off"
            className="pl-9"
          />
        </div>
      )}

      {/* Lista actual */}
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="eyebrow">
          {shown.length} {shown.length === 1 ? 'entrada' : 'entradas'}
          {filter && ` de ${list.length}`}
        </p>
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => save.mutate(restoreBase(kind))}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors duration-200 hover:text-primary-600"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar {hidden}{' '}
            {hidden === 1 ? 'oculta' : 'ocultas'}
          </button>
        )}
      </div>

      <div className="mt-2 max-h-72 overflow-y-auto rounded-card border border-line bg-surface p-2">
        {shown.length === 0 ? (
          <p className="px-1 py-3 text-sm text-content-muted">
            {filter ? 'Sin coincidencias.' : 'La lista está vacía. Añade la primera entrada.'}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {shown.map((value) => {
              const base = isBaseEntry(kind, value)
              return (
                <li key={value}>
                  <span
                    className={cn(
                      'group inline-flex items-center gap-1 rounded-full border py-1 pl-2.5 pr-1 text-xs transition-colors duration-200',
                      base
                        ? 'border-line bg-surface text-content'
                        : 'border-primary-200 bg-primary-50 text-primary-600',
                    )}
                  >
                    {value}
                    <button
                      type="button"
                      onClick={() => remove(value)}
                      aria-label={`Quitar ${value}`}
                      title={base ? 'Ocultar de la lista' : 'Eliminar'}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-content-subtle transition-colors duration-200 hover:bg-error hover:text-white"
                    >
                      <X className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="mt-2 text-2xs text-content-subtle">
        Las entradas <span className="font-semibold text-primary-600">resaltadas</span> son tuyas.
        Quitar una de la lista base solo la oculta: puedes restaurarla cuando quieras.
      </p>
    </div>
  )
}
