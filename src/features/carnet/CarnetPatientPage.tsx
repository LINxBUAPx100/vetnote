import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, IdCard, Syringe, Bug, Circle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton, ErrorState, EmptyState } from '@/components/feedback/States'
import { usePatient } from '@/features/patients/hooks'
import { useSettings } from '@/features/consultations/hooks'
import { usePatientCarnet } from './hooks'
import { CarnetCard } from './CarnetCard'
import { formatDate } from '@/utils/format'
import type { CarnetCategory } from '@/types/domain'

const CATEGORY_META: Record<CarnetCategory, { label: string; plural: string; icon: typeof Syringe }> = {
  vacuna: { label: 'Vacuna', plural: 'Vacunas', icon: Syringe },
  desparasitacion: { label: 'Desparasitación', plural: 'Desparasitaciones', icon: Bug },
  otro: { label: 'Otro', plural: 'Otros', icon: Circle },
}

/** Carnet sanitario de un paciente. */
export function CarnetPatientPage() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const patient = usePatient(patientId)
  const carnet = usePatientCarnet(patientId)
  const settings = useSettings()

  if (patient.isLoading) return <Skeleton className="mt-6 h-40" />
  if (patient.isError)
    return <ErrorState message={(patient.error as Error).message} onRetry={patient.refetch} />
  if (!patient.data) return null

  const p = patient.data
  const entries = carnet.data?.results ?? []

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        eyebrow={p.name}
        title="Carnet sanitario"
        back
        actions={
          <Button size="sm" onClick={() => navigate(`/carnet/${p.patient_id}/new`)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} /> Agregar
          </Button>
        }
      />

      {carnet.isLoading && <Skeleton className="h-24" />}
      {!carnet.isLoading && entries.length === 0 && (
        <EmptyState
          icon={IdCard}
          title="Carnet vacío"
          description="Registra vacunas y desparasitaciones para armar el carnet y compartirlo con el tutor."
          action={
            <Button onClick={() => navigate(`/carnet/${p.patient_id}/new`)}>
              <Plus className="h-4 w-4" strokeWidth={2.25} /> Agregar vacuna / desparasitación
            </Button>
          }
        />
      )}

      {/* Agrupado por tipo: Vacunas y Desparasitaciones van separadas. */}
      {(['vacuna', 'desparasitacion', 'otro'] as CarnetCategory[]).map((cat) => {
        const group = entries.filter((e) => e.category === cat)
        if (group.length === 0) return null
        const meta = CATEGORY_META[cat]
        const Icon = meta.icon
        return (
          <section key={cat}>
            <h2 className="eyebrow mb-2 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" strokeWidth={2} /> {meta.plural}
              <span className="tabular font-medium text-content-subtle">· {group.length}</span>
            </h2>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {group.map((e) => (
                <li key={e.entry_id}>
                  <Link to={`/carnet/entry/${e.entry_id}/edit`} className="row">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.9} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content-strong">{e.product}</p>
                      <p className="tabular mt-0.5 truncate text-xs text-content-subtle">
                        {formatDate(e.application_date)}
                        {e.next_due_date ? ` · próxima ${formatDate(e.next_due_date)}` : ''}
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
          </section>
        )
      })}

      {entries.length > 0 && (
        <details className="card p-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">
            Generar imagen del carnet
          </summary>
          <div className="mt-3">
            <CarnetCard
              entries={entries}
              patient={p}
              owner={p.owner}
              settings={settings.data}
            />
          </div>
        </details>
      )}
    </div>
  )
}
