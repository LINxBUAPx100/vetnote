import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IdCard, PawPrint, BellRing, ChevronRight } from 'lucide-react'
import { SearchInput } from '@/components/ui/Field'
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader'
import { Spinner, EmptyState } from '@/components/feedback/States'
import { useDebounced } from '@/hooks/useDebounced'
import { useSearchPatients } from '@/features/patients/hooks'
import { useUpcomingCarnet } from './hooks'
import { formatDate } from '@/utils/format'

/** Portada del Carnet sanitario: buscar mascota y ver próximas dosis. */
export function CarnetHomePage() {
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const search = useSearchPatients(debounced)
  const upcoming = useUpcomingCarnet()

  const today = new Date().toISOString().slice(0, 10)
  const dueSoon = (upcoming.data?.results ?? []).filter((e) => (e.next_due_date ?? '') >= today)

  return (
    <div>
      <PageHeader
        title="Carnet sanitario"
        description="Vacunas, desparasitaciones y refuerzos de cada mascota."
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        label="Buscar mascota"
        placeholder="Buscar mascota por nombre o tutor…"
      />

      {search.isFetching && <Spinner className="mx-auto my-4" />}
      {debounced.length >= 2 && search.data && (
        <div className="mt-3">
          {search.data.results.length === 0 ? (
            <p className="rounded-card border border-dashed border-line-strong px-4 py-4 text-sm text-content-muted">
              Sin resultados para “{debounced}”.
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {search.data.results.map((p) => (
                <li key={p.patient_id}>
                  <Link to={`/carnet/${p.patient_id}`} className="row">
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
                    <IdCard className="h-4 w-4 shrink-0 text-content-subtle" strokeWidth={1.9} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <section className="mt-9">
        <SectionHeader title="Próximas dosis" count={dueSoon.length} />
        {upcoming.isLoading && <Spinner className="mx-auto my-4" />}
        {!upcoming.isLoading && dueSoon.length === 0 && (
          <EmptyState
            icon={BellRing}
            title="Sin dosis próximas"
            description="Cuando registres una vacuna o desparasitación con fecha de refuerzo, aparecerá aquí."
          />
        )}
        {dueSoon.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {dueSoon.slice(0, 20).map((e) => (
              <li key={e.entry_id}>
                <Link to={`/carnet/entry/${e.entry_id}/edit`} className="row">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent"
                    aria-hidden
                  >
                    <BellRing className="h-4 w-4" strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content-strong">{e.product}</p>
                    <p className="mt-0.5 text-xs text-content-subtle">
                      Próxima dosis: {formatDate(e.next_due_date)}
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
      </section>
    </div>
  )
}
