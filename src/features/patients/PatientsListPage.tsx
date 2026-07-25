import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PawPrint, Plus, ChevronRight } from 'lucide-react'
import { SearchInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, SkeletonList, ErrorState } from '@/components/feedback/States'
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
  const newHref = isSearching
    ? `/patients/new?name=${encodeURIComponent(debounced.trim())}`
    : '/patients/new'

  return (
    <div>
      <PageHeader
        title="Pacientes"
        description="Expedientes de todas las mascotas registradas."
        actions={
          <Button size="sm" onClick={() => navigate('/patients/new')}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} /> Nuevo
          </Button>
        }
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        label="Buscar pacientes"
        placeholder="Nombre, tutor, teléfono, raza o microchip…"
      />

      <div className="mt-4">
        {loading && <SkeletonList />}

        {error && (
          <ErrorState
            message={(error as Error).message}
            onRetry={() => (isSearching ? search.refetch() : list.refetch())}
          />
        )}

        {!loading && !error && items && items.length === 0 && (
          <EmptyState
            icon={PawPrint}
            title={isSearching ? `Sin coincidencias para “${debounced}”` : 'Aún no hay pacientes'}
            description={
              isSearching
                ? 'Puedes registrarlo como paciente nuevo; conservaremos el nombre que escribiste.'
                : 'Registra la primera mascota para empezar a llevar su historial clínico.'
            }
            action={
              <Button onClick={() => navigate(newHref)}>
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                {isSearching ? `Registrar “${debounced}”` : 'Registrar paciente'}
              </Button>
            }
          />
        )}

        {!loading && items && items.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {items.map((p) => (
              <li key={p.patient_id}>
                <Link to={`/patients/${p.patient_id}`} className="row">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary"
                    aria-hidden
                  >
                    <PawPrint className="h-4 w-4" strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content-strong">{p.name}</p>
                    <p className="mt-0.5 truncate text-xs text-content-subtle">
                      {[p.species, p.breed].filter(Boolean).join(' · ')}
                      {p.owner_name ? ` — ${p.owner_name}` : ''}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-content-subtle"
                    strokeWidth={1.9}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
