import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, ErrorState } from '@/components/feedback/States'
import { NotePreview } from './NotePreview'
import { LazyClinicalNoteCard } from './LazyClinicalNoteCard'
import { generateWhatsAppNote } from './noteGenerator'
import { useConsultation, useSettings } from './hooks'
import { usePatient } from '@/features/patients/hooks'
import { formatDate } from '@/utils/format'

export function ConsultationDetailPage() {
  const { consultationId } = useParams()
  const navigate = useNavigate()
  const consultation = useConsultation(consultationId)
  const settings = useSettings()
  const patient = usePatient(consultation.data?.patient_id)

  const note = useMemo(() => {
    if (!consultation.data) return ''
    // Prefiere la nota guardada en su momento; si no, la regenera.
    if (consultation.data.whatsapp_note) return consultation.data.whatsapp_note
    return generateWhatsAppNote({
      consultation: consultation.data,
      patient: patient.data,
      owner: patient.data?.owner,
      settings: settings.data,
    })
  }, [consultation.data, patient.data, settings.data])

  if (consultation.isLoading) return <Skeleton className="mt-6 h-40" />
  if (consultation.isError)
    return <ErrorState message={(consultation.error as Error).message} onRetry={consultation.refetch} />
  if (!consultation.data) return null

  const c = consultation.data

  return (
    <div className="space-y-4 pb-6">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold">{c.presumptive_diagnosis || c.reason || 'Consulta'}</h1>
          <p className="text-xs text-content-muted">
            {formatDate(c.consultation_date)}
            {c.consultation_type === 'follow_up' ? ' · Seguimiento' : ''}
            {patient.data ? ` · ${patient.data.name}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/consultations/${c.consultation_id}/edit`)}
          aria-label="Editar"
        >
          <Pencil className="h-5 w-5" />
        </button>
      </header>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-content-muted">Nota para WhatsApp</h2>
        <NotePreview note={note} />
      </div>

      {patient.data && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => navigate(`/patients/${patient.data!.patient_id}`)}
        >
          <FileText className="h-4 w-4" /> Ver expediente
        </Button>
      )}

      <details>
        <summary className="cursor-pointer text-sm font-medium text-primary">Generar imagen</summary>
        <div className="mt-2">
          <LazyClinicalNoteCard consultation={c} patient={patient.data} settings={settings.data} />
        </div>
      </details>
    </div>
  )
}
