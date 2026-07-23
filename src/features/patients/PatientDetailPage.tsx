import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  PawPrint,
  Plus,
  Pencil,
  Phone,
  MessageCircle,
  Stethoscope,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, ErrorState, EmptyState } from '@/components/feedback/States'
import { usePatient, usePatientHistory } from './hooks'
import { formatDate, phoneDigits } from '@/utils/format'

export function PatientDetailPage() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const patient = usePatient(patientId)
  const history = usePatientHistory(patientId)

  if (patient.isLoading) return <Skeleton className="mt-6 h-40" />
  if (patient.isError)
    return <ErrorState message={(patient.error as Error).message} onRetry={patient.refetch} />
  if (!patient.data) return null

  const p = patient.data
  const owner = p.owner
  const phone = phoneDigits(owner?.phone)

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate('/patients')} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Expediente</h1>
      </header>

      {/* Encabezado del paciente */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PawPrint className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">{p.name}</h2>
            <p className="text-sm text-content-muted">
              {[p.species, p.breed, p.sex].filter(Boolean).join(' · ')}
              {p.approximate_age ? ` · ${p.approximate_age}` : ''}
            </p>
            {typeof p.weight === 'number' && p.weight > 0 && (
              <p className="text-sm text-content-muted">Peso: {p.weight} kg</p>
            )}
            {owner && (
              <p className="mt-1 text-sm">
                Tutor: <span className="font-medium">{owner.full_name}</span>
              </p>
            )}
          </div>
        </div>

        {p.clinical_notes && (
          <div className="mt-3 rounded-lg bg-warning/10 p-2 text-sm text-content">
            <span className="font-medium text-warning">Alertas / notas: </span>
            {p.clinical_notes}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => navigate(`/patients/${p.patient_id}/consultations/new`)}>
          <Plus className="h-4 w-4" /> Nueva consulta
        </Button>
        <Button variant="ghost" onClick={() => navigate(`/patients/${p.patient_id}/edit`)}>
          <Pencil className="h-4 w-4" /> Editar
        </Button>
        {phone && (
          <>
            <a href={`tel:${phone}`} className="btn-ghost">
              <Phone className="h-4 w-4" /> Llamar
            </a>
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </>
        )}
      </div>

      {/* Historial */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-content-muted">Historial clínico</h2>
        {history.isLoading && <Skeleton className="h-24" />}
        {history.data && history.data.results.length === 0 && (
          <EmptyState
            icon={Stethoscope}
            title="Sin consultas aún"
            description="Registra la primera consulta de este paciente."
          />
        )}
        <ol className="space-y-2">
          {history.data?.results.map((c) => (
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
                <p className="mt-1 font-medium">
                  {c.presumptive_diagnosis || c.reason || 'Consulta'}
                </p>
                {c.reason && c.presumptive_diagnosis && (
                  <p className="truncate text-sm text-content-muted">{c.reason}</p>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
