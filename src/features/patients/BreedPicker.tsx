import { useId, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { breedsForSpecies, splitBreed, joinBreed } from './breeds'
import type { Species } from '@/types/domain'

interface Props {
  species?: Species
  value: string
  onChange: (value: string) => void
}

/**
 * Selector de raza: sugerencias por especie (datalist, se puede escribir a
 * mano) y opción de una segunda raza para mestizos/cruces.
 */
export function BreedPicker({ species, value, onChange }: Props) {
  const listId = useId()
  const options = breedsForSpecies(species)
  const [primary, secondary] = splitBreed(value)
  const [showSecond, setShowSecond] = useState(Boolean(secondary))

  const setPrimary = (v: string) => onChange(joinBreed(v, secondary))
  const setSecondary = (v: string) => onChange(joinBreed(primary, v))

  return (
    <div className="space-y-2">
      <datalist id={listId}>
        {options.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <Input
        value={primary}
        onChange={(e) => setPrimary(e.target.value)}
        list={options.length ? listId : undefined}
        placeholder="Mestizo, Labrador, Americano de Pelo Corto…"
      />

      {showSecond ? (
        <div className="flex items-center gap-2">
          <Input
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            list={options.length ? listId : undefined}
            placeholder="Segunda raza (cruce)"
          />
          <button
            type="button"
            aria-label="Quitar segunda raza"
            onClick={() => {
              setShowSecond(false)
              onChange(joinBreed(primary, ''))
            }}
            className="shrink-0 rounded-lg border border-border p-2.5 text-content-muted hover:text-error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSecond(true)}
          className="flex items-center gap-1 text-xs font-medium text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Añadir segunda raza (mestizo/cruce)
        </button>
      )}
    </div>
  )
}
