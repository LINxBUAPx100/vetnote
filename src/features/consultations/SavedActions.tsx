import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Copy, Image as ImageIcon, FileText, RefreshCw, CalendarPlus, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { NotePreview } from './NotePreview'
import { LazyClinicalNoteCard } from './LazyClinicalNoteCard'
import type { Consultation, Patient, ClinicSettings } from '@/types/domain'

interface Props {
  note: string
  consultation: Consultation
  patient: Pick<Patient, 'patient_id' | 'name' | 'species' | 'breed'>
  settings?: ClinicSettings | null
  /** Reinicia el wizard para una nueva consulta del mismo paciente (sin recargar). */
  onNewConsultation: () => void
  /** Reinicia el wizard enlazando como seguimiento de la consulta recién guardada. */
  onFollowUp: () => void
}

/** Pantalla post-guardado: acciones recursivas sin volver al inicio. */
export function SavedActions({
  note,
  consultation,
  patient,
  settings,
  onNewConsultation,
  onFollowUp,
}: Props) {
  const navigate = useNavigate()
  const [panel, setPanel] = useState<'none' | 'note' | 'image'>('note')

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h1 className="text-xl font-bold">Consulta guardada</h1>
        <p className="text-sm text-content-muted">{patient.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant={panel === 'note' ? 'primary' : 'ghost'} onClick={() => setPanel('note')}>
          <Copy className="h-4 w-4" /> Copiar nota
        </Button>
        <Button variant={panel === 'image' ? 'primary' : 'ghost'} onClick={() => setPanel('image')}>
          <ImageIcon className="h-4 w-4" /> Generar imagen
        </Button>
      </div>

      {panel === 'note' && <NotePreview note={note} />}
      {panel === 'image' && (
        <LazyClinicalNoteCard consultation={consultation} patient={patient} settings={settings} />
      )}

      <div className="space-y-2 pt-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate(`/patients/${patient.patient_id}`)}
        >
          <FileText className="h-4 w-4" /> Ver expediente
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={onNewConsultation}>
          <RefreshCw className="h-4 w-4" /> Nueva consulta del mismo paciente
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={onFollowUp}>
          <CalendarPlus className="h-4 w-4" /> Registrar seguimiento
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/')}>
          <Home className="h-4 w-4" /> Ir al inicio
        </Button>
      </div>
    </div>
  )
}
