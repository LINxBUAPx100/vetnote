import { Link, useNavigate } from 'react-router-dom'
import { Stethoscope, Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { SkeletonList, EmptyState, ErrorState } from '@/components/feedback/States'
import { useRecentConsultations } from './hooks'
import { formatDate, formatTime } from '@/utils/format'

export function ConsultationsListPage() {
  const navigate = useNavigate()
  const recent = useRecentConsultations(25)

  return (
    <div>
      <PageHeader
        title="Consultas"
        description="Historial de las consultas registradas."
        actions={
          <Button size="sm" onClick={() => navigate('/consultations/new')}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} /> Nueva
          </Button>
        }
      />

      {recent.isLoading && <SkeletonList />}
      {recent.isError && (
        <ErrorState message={(recent.error as Error).message} onRetry={recent.refetch} />
      )}
      {recent.data && recent.data.results.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="Sin consultas registradas"
          description="Cada consulta guarda anamnesis, examen, tratamiento y genera la nota para el tutor."
          action={
            <Button onClick={() => navigate('/consultations/new')}>
              <Plus className="h-4 w-4" strokeWidth={2.25} /> Registrar consulta
            </Button>
          }
        />
      )}

      {recent.data && recent.data.results.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {recent.data.results.map((c) => (
            <li key={c.consultation_id}>
              <Link to={`/consultations/${c.consultation_id}`} className="row">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-content-strong">
                      {c.presumptive_diagnosis || c.reason || 'Consulta'}
                    </p>
                    {c.consultation_type === 'follow_up' && (
                      <span className="chip-neutral shrink-0">Seguimiento</span>
                    )}
                  </div>
                  <p className="tabular mt-0.5 text-xs text-content-subtle">
                    {formatDate(c.consultation_date)}
                    {c.attended_at ? ` · ${formatTime(c.attended_at)}` : ''}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-content-subtle" strokeWidth={1.9} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
