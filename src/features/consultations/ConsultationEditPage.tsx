import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Spinner, ErrorState } from '@/components/feedback/States'
import { ClinicalTextarea } from './ClinicalTextarea'
import { NotePreview } from './NotePreview'
import { generateWhatsAppNote } from './noteGenerator'
import { parseCustomValues } from './customFields'
import { useConsultation, useUpdateConsultation, useSettings } from './hooks'
import { usePatient } from '@/features/patients/hooks'
import { isConsultationEmpty, type ConsultationForm } from '@/schemas'
import { toast } from '@/stores/uiStore'
import { ApiClientError } from '@/types/api'
import type { Consultation } from '@/types/domain'

type FormData = Partial<ConsultationForm> & { custom_values?: string }

/** Edición de una consulta existente (una sola página con control de conflicto). */
export function ConsultationEditPage() {
  const { consultationId } = useParams()
  const navigate = useNavigate()
  const consultation = useConsultation(consultationId)
  const settings = useSettings()
  const patient = usePatient(consultation.data?.patient_id)
  const update = useUpdateConsultation()

  const [form, setForm] = useState<FormData>({})

  useEffect(() => {
    if (consultation.data) setForm(consultation.data)
  }, [consultation.data])

  const set = (name: keyof FormData, value: unknown) =>
    setForm((f) => ({ ...f, [name]: value }))

  const setCustomValue = (index: number, value: string) => {
    const arr = parseCustomValues(form.custom_values)
    if (!arr[index]) return
    arr[index] = { ...arr[index], value }
    set('custom_values', JSON.stringify(arr))
  }

  const note = useMemo(
    () =>
      generateWhatsAppNote({
        consultation: form as Partial<Consultation>,
        patient: patient.data,
        owner: patient.data?.owner,
        settings: settings.data,
      }),
    [form, patient.data, settings.data],
  )

  if (consultation.isLoading) return <Spinner className="mx-auto mt-10" />
  if (consultation.isError)
    return <ErrorState message={(consultation.error as Error).message} onRetry={consultation.refetch} />
  if (!consultation.data) return null

  const save = async () => {
    if (isConsultationEmpty(form)) return toast.error('La consulta no puede estar vacía')
    try {
      await update.mutateAsync({
        payload: {
          ...form,
          consultation_id: consultation.data!.consultation_id,
          whatsapp_note: note,
        } as Partial<Consultation> & { consultation_id: string },
        expectedUpdatedAt: consultation.data!.updated_at,
      })
      toast.success('Consulta actualizada')
      navigate(`/consultations/${consultation.data!.consultation_id}`)
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'CONFLICT') {
        toast.error('Este registro fue modificado desde otro dispositivo. Recarga para ver la versión más reciente.')
        consultation.refetch()
      } else {
        toast.error((e as Error).message)
      }
    }
  }

  const t = (k: keyof FormData) => (form[k] as string) ?? ''

  return (
    <div className="space-y-3 pb-28">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-bold">Editar consulta</h1>
      </header>

      <ClinicalTextarea label="Motivo de consulta" value={t('reason')} onChange={(v) => set('reason', v)} />
      <ClinicalTextarea label="Anamnesis actual" value={t('current_anamnesis')} onChange={(v) => set('current_anamnesis', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso (kg)">
          <Input inputMode="decimal" value={t('weight')} onChange={(e) => set('weight', e.target.value)} />
        </Field>
        <Field label="Temperatura (°C)">
          <Input inputMode="decimal" value={t('temperature')} onChange={(e) => set('temperature', e.target.value)} />
        </Field>
      </div>
      <ClinicalTextarea label="Cabeza y cuello" value={t('head_neck')} onChange={(v) => set('head_neck', v)} showPhrases />
      <ClinicalTextarea label="Tórax y MAs" value={t('thorax_forelimbs')} onChange={(v) => set('thorax_forelimbs', v)} showPhrases />
      <ClinicalTextarea label="Abdomen, MPs, ano y cola" value={t('abdomen_hindlimbs_anus_tail')} onChange={(v) => set('abdomen_hindlimbs_anus_tail', v)} showPhrases />
      <ClinicalTextarea label="Diagnóstico presuntivo" value={t('presumptive_diagnosis')} onChange={(v) => set('presumptive_diagnosis', v)} />
      <ClinicalTextarea label="Tratamiento" value={t('treatment')} onChange={(v) => set('treatment', v)} />
      <ClinicalTextarea label="Recomendaciones" value={t('recommendations')} onChange={(v) => set('recommendations', v)} showPhrases />

      {parseCustomValues(form.custom_values).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-content-muted">Campos de la plantilla</h2>
          {parseCustomValues(form.custom_values).map((f, i) => (
            <Field key={i} label={f.label}>
              <Input value={f.value} onChange={(e) => setCustomValue(i, e.target.value)} />
            </Field>
          ))}
        </div>
      )}

      <details>
        <summary className="cursor-pointer text-sm font-medium text-primary">Vista previa de la nota</summary>
        <div className="mt-2">
          <NotePreview note={note} />
        </div>
      </details>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          <Button onClick={save} loading={update.isPending} className="w-full py-3.5">
            <Save className="h-4 w-4" /> Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
