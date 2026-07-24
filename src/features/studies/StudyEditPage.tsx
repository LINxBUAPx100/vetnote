import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { Field, Input, Textarea, DateInput, DateTimeInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useStudy, useCreateStudy, useUpdateStudy } from './hooks'
import { studyService } from '@/services/studyService'
import { toast } from '@/stores/uiStore'
import { ApiClientError } from '@/types/api'
import { nowDateTimeLocalValue, fromDateTimeLocalValue, todayInputValue } from '@/utils/format'
import type { Study } from '@/types/domain'

type Form = Partial<Study>

const STUDY_TYPES = [
  'Hematología',
  'Bioquímica sanguínea',
  'Uroanálisis',
  'Coproparasitoscópico',
  'Citología',
  'Radiografía',
  'Ecografía',
  'Prueba rápida',
  'Otro',
]

/** Crear / editar un estudio complementario. */
export function StudyEditPage() {
  const { patientId, studyId } = useParams()
  const isEdit = Boolean(studyId)
  const navigate = useNavigate()
  const existing = useStudy(studyId)
  const create = useCreateStudy()
  const update = useUpdateStudy()

  const [form, setForm] = useState<Form>({
    study_date: todayInputValue(),
    attended_at: fromDateTimeLocalValue(nowDateTimeLocalValue()),
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (isEdit && existing.data) setForm(existing.data)
  }, [isEdit, existing.data])

  const set = (name: keyof Form, value: unknown) => setForm((f) => ({ ...f, [name]: value }))
  const t = (k: keyof Form) => (form[k] as string) ?? ''
  const targetPatient = patientId ?? existing.data?.patient_id

  const save = async () => {
    try {
      if (isEdit) {
        await update.mutateAsync({
          payload: { ...form, study_id: studyId! } as Partial<Study> & { study_id: string },
          expectedUpdatedAt: existing.data?.updated_at,
        })
      } else {
        if (!targetPatient) return toast.error('Falta el paciente')
        await create.mutateAsync({ ...form, patient_id: targetPatient })
      }
      toast.success(isEdit ? 'Estudio actualizado' : 'Estudio guardado')
      if (targetPatient) navigate(`/patients/${targetPatient}`)
      else navigate(-1)
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'CONFLICT') {
        toast.error('Este estudio fue modificado desde otro dispositivo.')
        existing.refetch()
      } else {
        toast.error((e as Error).message)
      }
    }
  }

  const remove = async () => {
    await studyService.softDelete(studyId!)
    toast.success('Estudio eliminado')
    navigate(targetPatient ? `/patients/${targetPatient}` : '/patients')
  }

  if (isEdit && existing.isLoading) return <Spinner className="mx-auto mt-10" />

  return (
    <div className="space-y-3 pb-28">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Editar estudio' : 'Nuevo estudio'}</h1>
      </header>

      <Field label="Tipo de estudio">
        <Input
          value={t('study_type')}
          onChange={(e) => set('study_type', e.target.value)}
          list="study-types"
          placeholder="Hematología, radiografía…"
        />
        <datalist id="study-types">
          {STUDY_TYPES.map((x) => (
            <option key={x} value={x} />
          ))}
        </datalist>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Fecha del estudio">
          <DateInput value={t('study_date')} onChange={(v) => set('study_date', v)} />
        </Field>
        <Field label="Hora de atención">
          <DateTimeInput value={t('attended_at')} onChange={(v) => set('attended_at', v)} />
        </Field>
      </div>

      <Field label="Motivo / solicitud">
        <Textarea value={t('request_reason')} onChange={(e) => set('request_reason', e.target.value)} />
      </Field>
      <Field label="Resultados / hallazgos">
        <Textarea value={t('findings')} onChange={(e) => set('findings', e.target.value)} />
      </Field>
      <Field label="Interpretación">
        <Textarea value={t('interpretation')} onChange={(e) => set('interpretation', e.target.value)} />
      </Field>
      <Field label="Notas">
        <Textarea value={t('notes')} onChange={(e) => set('notes', e.target.value)} placeholder="opcional" />
      </Field>

      {isEdit && (
        <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> Eliminar estudio
        </Button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          <Button
            onClick={save}
            loading={create.isPending || update.isPending}
            className="w-full py-3.5"
          >
            <Save className="h-4 w-4" /> {isEdit ? 'Guardar cambios' : 'Guardar estudio'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        danger
        title="¿Eliminar este estudio?"
        confirmLabel="Eliminar"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
