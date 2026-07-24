import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, IdCard, Syringe, Bug, Circle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, ErrorState, EmptyState } from '@/components/feedback/States'
import { usePatient } from '@/features/patients/hooks'
import { useSettings } from '@/features/consultations/hooks'
import { usePatientCarnet } from './hooks'
import { CarnetCard } from './CarnetCard'
import { formatDate } from '@/utils/format'
import type { CarnetCategory } from '@/types/domain'

const CATEGORY_META: Record<CarnetCategory, { label: string; icon: typeof Syringe }> = {
  vacuna: { label: 'Vacuna', icon: Syringe },
  desparasitacion: { label: 'Desparasitación', icon: Bug },
  otro: { label: 'Otro', icon: Circle },
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
    <div className="space-y-4 pb-6">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Carnet sanitario</h1>
          <p className="text-xs text-content-muted">{p.name}</p>
        </div>
      </header>

      <Button className="w-full" onClick={() => navigate(`/carnet/${p.patient_id}/new`)}>
        <Plus className="h-4 w-4" /> Agregar vacuna / desparasitación
      </Button>

      {carnet.isLoading && <Skeleton className="h-24" />}
      {!carnet.isLoading && entries.length === 0 && (
        <EmptyState
          icon={IdCard}
          title="Carnet vacío"
          description="Registra vacunas y desparasitaciones para armar el carnet."
        />
      )}

      <ul className="space-y-2">
        {entries.map((e) => {
          const meta = CATEGORY_META[e.category] ?? CATEGORY_META.otro
          const Icon = meta.icon
          return (
            <li key={e.entry_id}>
              <Link
                to={`/carnet/entry/${e.entry_id}/edit`}
                className="card flex items-center gap-3 p-3 hover:bg-background"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.product}</p>
                  <p className="truncate text-sm text-content-muted">
                    {meta.label} · {formatDate(e.application_date)}
                    {e.next_due_date ? ` · próxima ${formatDate(e.next_due_date)}` : ''}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-content-muted" />
              </Link>
            </li>
          )
        })}
      </ul>

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
