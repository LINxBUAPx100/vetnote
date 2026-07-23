import { useState } from 'react'
import { Search, PawPrint, Plus } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { useDebounced } from '@/hooks/useDebounced'
import { useSearchPatients } from '@/features/patients/hooks'
import { useNavigate } from 'react-router-dom'
import type { PatientSearchResult } from '@/services/patientService'

/** Paso 1 del wizard: buscar/seleccionar paciente (o crear uno nuevo). */
export function PatientPicker({ onSelect }: { onSelect: (p: PatientSearchResult) => void }) {
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const search = useSearchPatients(debounced)
  const navigate = useNavigate()

  return (
    <div className="space-y-3">
      <label className="flex min-h-touch items-center gap-2 rounded-xl border border-border bg-surface px-3">
        <Search className="h-5 w-5 text-content-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar paciente por nombre o tutor…"
          aria-label="Buscar paciente"
          autoFocus
          className="border-0 bg-transparent px-0 focus:ring-0"
        />
      </label>

      {search.isFetching && <Spinner className="mx-auto" />}

      {search.data && search.data.results.length === 0 && debounced.length >= 2 && (
        <div className="card p-4 text-center text-sm text-content-muted">
          <p>No se encontró “{debounced}”.</p>
          <Button className="mt-2" onClick={() => navigate('/patients/new')}>
            <Plus className="h-4 w-4" /> Registrar paciente
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {search.data?.results.map((p) => (
          <li key={p.patient_id}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className="card flex w-full items-center gap-3 p-3 text-left hover:bg-background"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PawPrint className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-sm text-content-muted">
                  {[p.species, p.breed].filter(Boolean).join(' · ')}
                  {p.owner_name ? ` — ${p.owner_name}` : ''}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
