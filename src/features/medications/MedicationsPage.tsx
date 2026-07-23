import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Pill, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, EmptyState, ErrorState } from '@/components/feedback/States'
import { medicationService } from '@/services/catalogService'

export function MedicationsPage() {
  const meds = useQuery({ queryKey: ['medications'], queryFn: () => medicationService.list() })
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Medicamentos</h1>
        <Button className="px-3" onClick={() => navigate('/medications/new')}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </header>
      <p className="text-sm text-content-muted">
        Catálogo auxiliar de referencia. No sustituye el juicio clínico ni sugiere dosis.
      </p>

      {meds.isLoading && <Skeleton className="h-24" />}
      {meds.isError && <ErrorState message={(meds.error as Error).message} onRetry={meds.refetch} />}
      {meds.data && meds.data.results.length === 0 && (
        <EmptyState
          icon={Pill}
          title="Catálogo vacío"
          description="Agrega tu primer medicamento con el botón Nuevo."
        />
      )}

      <ul className="space-y-2">
        {meds.data?.results.map((m) => (
          <li key={m.medication_id}>
            <Link
              to={`/medications/${m.medication_id}/edit`}
              className="card flex items-center gap-3 p-3 transition-colors hover:bg-background"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Pill className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.generic_name}</p>
                <p className="truncate text-sm text-content-muted">
                  {[m.commercial_name, m.presentation, m.concentration].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Pencil className="h-4 w-4 text-content-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
