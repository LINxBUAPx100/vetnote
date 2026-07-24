import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, IdCard, PawPrint, BellRing } from 'lucide-react'
import { Input } from '@/components/ui/Field'
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
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold">Carnet sanitario</h1>
        <p className="text-sm text-content-muted">
          Vacunas, desparasitaciones y refuerzos por mascota.
        </p>
      </header>

      <label className="flex min-h-touch items-center gap-2 rounded-xl border border-border bg-surface px-3">
        <Search className="h-5 w-5 text-content-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar mascota por nombre o tutor…"
          aria-label="Buscar mascota"
          className="border-0 bg-transparent px-0 focus:ring-0"
        />
      </label>

      {search.isFetching && <Spinner className="mx-auto" />}
      {debounced.length >= 2 && search.data && (
        <ul className="space-y-2">
          {search.data.results.map((p) => (
            <li key={p.patient_id}>
              <Link
                to={`/carnet/${p.patient_id}`}
                className="card flex items-center gap-3 p-3 hover:bg-background"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <PawPrint className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-sm text-content-muted">
                    {[p.species, p.breed].filter(Boolean).join(' · ')}
                    {p.owner_name ? ` — ${p.owner_name}` : ''}
                  </p>
                </div>
                <IdCard className="h-5 w-5 text-content-muted" />
              </Link>
            </li>
          ))}
          {search.data.results.length === 0 && (
            <p className="text-center text-sm text-content-muted">Sin resultados.</p>
          )}
        </ul>
      )}

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-content-muted">
          <BellRing className="h-4 w-4" /> Próximas dosis
        </h2>
        {upcoming.isLoading && <Spinner className="mx-auto" />}
        {!upcoming.isLoading && dueSoon.length === 0 && (
          <EmptyState icon={BellRing} title="Sin dosis próximas" description="Nada agendado por ahora." />
        )}
        <ul className="space-y-2">
          {dueSoon.slice(0, 20).map((e) => (
            <li key={e.entry_id}>
              <Link
                to={`/carnet/entry/${e.entry_id}/edit`}
                className="card flex items-center gap-3 p-3 hover:bg-background"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <BellRing className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.product}</p>
                  <p className="text-sm text-content-muted">
                    Próxima dosis: {formatDate(e.next_due_date)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
