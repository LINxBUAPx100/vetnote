import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  PawPrint,
  Plus,
  Pencil,
  Phone,
  Stethoscope,
  Calendar,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, ErrorState, EmptyState } from '@/components/feedback/States'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { WhatsAppMenu } from '@/components/WhatsAppMenu'
import { usePatient, usePatientHistory } from './hooks'
import { patientService } from '@/services/patientService'
import { toast } from '@/stores/uiStore'
import { formatDate, phoneDigits } from '@/utils/format'

export function PatientDetailPage() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const patient = usePatient(patientId)
  const history = usePatientHistory(patientId)

  const remove = useMutation({
    mutationFn: () => patientService.softDelete(patientId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      if (patient.data?.owner) {
        qc.invalidateQueries({ queryKey: ['owner', patient.data.owner.owner_id, 'pets'] })
      }
      toast.success('Mascota eliminada')
      navigate(patient.data?.owner ? `/owners/${patient.data.owner.owner_id}` : '/patients')
    },
    onError: (e) => {
      setConfirmDelete(false)
      toast.error((e as Error).message)
    },
  })

  if (patient.isLoading) return <Skeleton className="mt-6 h-40" />
  if (patient.isError)
    return <ErrorState message={(patient.error as Error).message} onRetry={patient.refetch} />
  if (!patient.data) return null

  const p = patient.data
  const owner = p.owner
  const phone = phoneDigits(owner?.phone)
  const consultationCount = history.data?.results.length ?? 0

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
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
                <span>
                  Tutor: <span className="font-medium">{owner.full_name}</span>
                  {owner.phone ? ` · ${owner.phone}` : ''}
                </span>
                <Link
                  to={`/owners/${owner.owner_id}/edit`}
                  className="inline-flex items-center gap-1 font-medium text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar tutor
                </Link>
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
            <WhatsAppMenu phone={phone} petName={p.name} ownerName={owner?.full_name} />
          </>
        )}
      </div>

      <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
        <Trash2 className="h-4 w-4" /> Eliminar mascota
      </Button>

      {/* Historial */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-content-muted">
          Historial clínico
          {consultationCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {consultationCount} consulta{consultationCount === 1 ? '' : 's'}
            </span>
          )}
        </h2>
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

      <ConfirmDialog
        open={confirmDelete}
        danger
        title={`¿Eliminar a ${p.name}?`}
        description="La mascota y su expediente se darán de baja. Esta acción se puede revertir desde la hoja de cálculo si es necesario."
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
