import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, PawPrint, Plus, Phone } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { EmptyState, Skeleton, ErrorState } from '@/components/feedback/States'
import { useDebounced } from '@/hooks/useDebounced'
import type { PatientSearchResult } from '@/services/patientService'
import { useSearchPatients, usePatientList } from './hooks'

export function PatientsListPage() {
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const navigate = useNavigate()

  const isSearching = debounced.trim().length >= 2
  const search = useSearchPatients(debounced)
  const list = usePatientList(1)

  const items = (isSearching ? search.data?.results : list.data?.results) as
    | PatientSearchResult[]
    | undefined
  const loading = isSearching ? search.isLoading : list.isLoading
  const error = isSearching ? search.error : list.error

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pacientes</h1>
        <Button onClick={() => navigate('/patients/new')} className="px-3">
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </header>

      <label className="flex min-h-touch items-center gap-2 rounded-xl border border-border bg-surface px-3">
        <Search className="h-5 w-5 text-content-muted" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, tutor, teléfono, raza…"
          aria-label="Buscar pacientes"
          className="border-0 bg-transparent px-0 focus:ring-0"
        />
      </label>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {error && <ErrorState message={(error as Error).message} onRetry={() => (isSearching ? search.refetch() : list.refetch())} />}

      {!loading && !error && items && items.length === 0 && (
        <EmptyState
          icon={PawPrint}
          title={isSearching ? 'Sin coincidencias' : 'Aún no hay pacientes'}
          description={
            isSearching
              ? `No se encontró "${debounced}". Puedes registrarlo como nuevo paciente.`
              : 'Registra tu primer paciente para comenzar.'
          }
          action={
            <Button onClick={() => navigate('/patients/new')}>
              <Plus className="h-4 w-4" /> Nuevo paciente
            </Button>
          }
        />
      )}

      {!loading && items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.patient_id}>
              <Link
                to={`/patients/${p.patient_id}`}
                className="card flex items-center gap-3 p-3 transition-colors hover:bg-background"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <PawPrint className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-sm text-content-muted">
                    {[p.species, p.breed].filter(Boolean).join(' · ')}
                    {p.owner_name ? ` — ${p.owner_name}` : ''}
                  </p>
                </div>
                {p.owner_phone && (
                  <span className="flex items-center gap-1 text-xs text-content-muted">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
