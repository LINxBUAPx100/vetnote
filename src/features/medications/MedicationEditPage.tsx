import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { medicationService } from '@/services/catalogService'
import { toast } from '@/stores/uiStore'
import { ApiClientError } from '@/types/api'
import type { Medication } from '@/types/domain'

type MedForm = Partial<Medication>

const FIELDS: { key: keyof Medication; label: string; placeholder?: string }[] = [
  { key: 'commercial_name', label: 'Nombre comercial', placeholder: 'opcional' },
  { key: 'presentation', label: 'Presentación', placeholder: 'Tableta, suspensión…' },
  { key: 'concentration', label: 'Concentración', placeholder: '50 mg/ml' },
  { key: 'route', label: 'Vía', placeholder: 'Oral, IM, SC…' },
]

/** Crear o editar un medicamento del catálogo. */
export function MedicationEditPage() {
  const { medicationId } = useParams()
  const isEdit = Boolean(medicationId)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const meds = useQuery({ queryKey: ['medications'], queryFn: () => medicationService.list() })
  const [form, setForm] = useState<MedForm>({})
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | undefined>()

  useEffect(() => {
    if (isEdit && meds.data) {
      const m = meds.data.results.find((x) => x.medication_id === medicationId)
      if (m) {
        setForm(m)
        setLoadedUpdatedAt(m.updated_at)
      }
    }
  }, [isEdit, meds.data, medicationId])

  const set = (name: keyof MedForm, value: string) => setForm((f) => ({ ...f, [name]: value }))
  const t = (k: keyof MedForm) => (form[k] as string) ?? ''

  const save = useMutation({
    mutationFn: () => {
      if (!form.generic_name || !form.generic_name.trim()) {
        return Promise.reject(new ApiClientError('El nombre genérico es obligatorio', 'VALIDATION_ERROR'))
      }
      return isEdit
        ? medicationService.update(
            { ...form, medication_id: medicationId! } as Partial<Medication> & { medication_id: string },
            loadedUpdatedAt,
          )
        : medicationService.create(form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications'] })
      toast.success(isEdit ? 'Medicamento actualizado' : 'Medicamento agregado')
      navigate('/medications')
    },
    onError: (e) => {
      if (e instanceof ApiClientError && e.code === 'CONFLICT') {
        toast.error('Este medicamento fue modificado desde otro dispositivo. Recargando…')
        meds.refetch()
      } else {
        toast.error((e as Error).message)
      }
    },
  })

  if (isEdit && meds.isLoading) return <Spinner className="mx-auto mt-10" />

  return (
    <div className="space-y-3 pb-28">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Editar medicamento' : 'Nuevo medicamento'}</h1>
      </header>

      <Field label="Nombre genérico">
        <Input value={t('generic_name')} onChange={(e) => set('generic_name', e.target.value)} placeholder="Meloxicam" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, placeholder }) => (
          <Field key={key} label={label}>
            <Input value={t(key)} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} />
          </Field>
        ))}
      </div>
      <Field label="Instrucciones por defecto">
        <Textarea value={t('default_instructions')} onChange={(e) => set('default_instructions', e.target.value)} />
      </Field>
      <Field label="Notas">
        <Textarea value={t('notes')} onChange={(e) => set('notes', e.target.value)} placeholder="opcional" />
      </Field>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          <Button onClick={() => save.mutate()} loading={save.isPending} className="w-full py-3.5">
            <Save className="h-4 w-4" /> {isEdit ? 'Guardar cambios' : 'Agregar medicamento'}
          </Button>
        </div>
      </div>
    </div>
  )
}
