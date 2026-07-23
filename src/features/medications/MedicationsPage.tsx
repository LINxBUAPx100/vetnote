import { useQuery } from '@tanstack/react-query'
import { Pill } from 'lucide-react'
import { Skeleton, EmptyState, ErrorState } from '@/components/feedback/States'
import { medicationService } from '@/services/catalogService'

export function MedicationsPage() {
  const meds = useQuery({ queryKey: ['medications'], queryFn: () => medicationService.list() })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Medicamentos</h1>
      <p className="text-sm text-content-muted">
        Catálogo auxiliar de referencia. No sustituye el juicio clínico ni sugiere dosis.
      </p>

      {meds.isLoading && <Skeleton className="h-24" />}
      {meds.isError && <ErrorState message={(meds.error as Error).message} onRetry={meds.refetch} />}
      {meds.data && meds.data.results.length === 0 && (
        <EmptyState
          icon={Pill}
          title="Catálogo vacío"
          description="Agrega medicamentos en la hoja Medications de Google Sheets."
        />
      )}

      <ul className="space-y-2">
        {meds.data?.results.map((m) => (
          <li key={m.medication_id} className="card p-3">
            <p className="font-medium">{m.generic_name}</p>
            <p className="text-sm text-content-muted">
              {[m.commercial_name, m.presentation, m.concentration].filter(Boolean).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
