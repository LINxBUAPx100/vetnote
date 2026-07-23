import { Link, useNavigate } from 'react-router-dom'
import { Stethoscope, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, EmptyState, ErrorState } from '@/components/feedback/States'
import { useRecentConsultations } from './hooks'
import { formatDate } from '@/utils/format'

export function ConsultationsListPage() {
  const navigate = useNavigate()
  const recent = useRecentConsultations(25)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Consultas</h1>
        <Button className="px-3" onClick={() => navigate('/consultations/new')}>
          <Plus className="h-4 w-4" /> Nueva
        </Button>
      </header>

      {recent.isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}
      {recent.isError && (
        <ErrorState message={(recent.error as Error).message} onRetry={recent.refetch} />
      )}
      {recent.data && recent.data.results.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="Sin consultas recientes"
          description="Inicia una nueva consulta desde un paciente."
        />
      )}

      <ul className="space-y-2">
        {recent.data?.results.map((c) => (
          <li key={c.consultation_id}>
            <Link
              to={`/consultations/${c.consultation_id}`}
              className="card block p-3 transition-colors hover:bg-background"
            >
              <div className="flex items-center gap-2 text-xs text-content-muted">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(c.consultation_date)}
                {c.consultation_type === 'follow_up' && (
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-secondary">
                    Seguimiento
                  </span>
                )}
              </div>
              <p className="mt-1 font-medium">{c.presumptive_diagnosis || c.reason || 'Consulta'}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
