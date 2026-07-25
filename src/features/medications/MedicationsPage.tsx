import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Pill, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { SkeletonList, EmptyState, ErrorState } from '@/components/feedback/States'
import { medicationService } from '@/services/catalogService'

export function MedicationsPage() {
  const meds = useQuery({ queryKey: ['medications'], queryFn: () => medicationService.list() })
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Medicamentos"
        description="Catálogo auxiliar de referencia. No sustituye el juicio clínico ni sugiere dosis."
        actions={
          <Button size="sm" onClick={() => navigate('/medications/new')}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} /> Nuevo
          </Button>
        }
      />

      {meds.isLoading && <SkeletonList />}
      {meds.isError && <ErrorState message={(meds.error as Error).message} onRetry={meds.refetch} />}
      {meds.data && meds.data.results.length === 0 && (
        <EmptyState
          icon={Pill}
          title="Catálogo vacío"
          description="Agrega los medicamentos que más recetas para tenerlos a un toque en el tratamiento."
          action={
            <Button onClick={() => navigate('/medications/new')}>
              <Plus className="h-4 w-4" strokeWidth={2.25} /> Agregar medicamento
            </Button>
          }
        />
      )}

      {meds.data && meds.data.results.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {meds.data.results.map((m) => (
            <li key={m.medication_id}>
              <Link to={`/medications/${m.medication_id}/edit`} className="row group">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary"
                  aria-hidden
                >
                  <Pill className="h-4 w-4" strokeWidth={1.9} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content-strong">
                    {m.generic_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-content-subtle">
                    {[m.commercial_name, m.presentation, m.concentration]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Pencil
                  className="h-3.5 w-3.5 shrink-0 text-content-subtle opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  strokeWidth={1.9}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
