import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { Field, Input, Textarea, DateInput, DateTimeInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useInjection, useCreateInjection, useUpdateInjection } from './hooks'
import { injectionService } from '@/services/injectionService'
import { toast } from '@/stores/uiStore'
import { ApiClientError } from '@/types/api'
import { nowDateTimeLocalValue, fromDateTimeLocalValue, todayInputValue } from '@/utils/format'
import type { Injection } from '@/types/domain'

type Form = Partial<Injection>

/** Crear / editar un registro de inyección. */
export function InjectionEditPage() {
  const { patientId, injectionId } = useParams()
  const isEdit = Boolean(injectionId)
  const navigate = useNavigate()
  const existing = useInjection(injectionId)
  const create = useCreateInjection()
  const update = useUpdateInjection()

  const [form, setForm] = useState<Form>({
    injection_date: todayInputValue(),
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
    if (!t('product').trim()) return toast.error('Indica el producto aplicado')
    try {
      if (isEdit) {
        await update.mutateAsync({
          payload: { ...form, injection_id: injectionId! } as Partial<Injection> & {
            injection_id: string
          },
          expectedUpdatedAt: existing.data?.updated_at,
        })
      } else {
        if (!targetPatient) return toast.error('Falta el paciente')
        await create.mutateAsync({ ...form, patient_id: targetPatient })
      }
      toast.success(isEdit ? 'Inyección actualizada' : 'Inyección registrada')
      if (targetPatient) navigate(`/patients/${targetPatient}`)
      else navigate(-1)
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'CONFLICT') {
        toast.error('Este registro fue modificado desde otro dispositivo.')
        existing.refetch()
      } else {
        toast.error((e as Error).message)
      }
    }
  }

  const remove = async () => {
    await injectionService.softDelete(injectionId!)
    toast.success('Inyección eliminada')
    if (targetPatient) navigate(`/patients/${targetPatient}`)
    else navigate('/patients')
  }

  if (isEdit && existing.isLoading) return <Spinner className="mx-auto mt-10" />

  return (
    <div className="space-y-3 pb-28">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Editar inyección' : 'Nueva inyección'}</h1>
      </header>

      <Field label="Producto aplicado">
        <Input
          value={t('product')}
          onChange={(e) => set('product', e.target.value)}
          placeholder="Antibiótico, analgésico, suero…"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dosis">
          <Input value={t('dose')} onChange={(e) => set('dose', e.target.value)} placeholder="1 ml" />
        </Field>
        <Field label="Vía">
          <Input value={t('route')} onChange={(e) => set('route', e.target.value)} placeholder="IM, SC, IV" />
        </Field>
        <Field label="Sitio de aplicación">
          <Input value={t('site')} onChange={(e) => set('site', e.target.value)} placeholder="opcional" />
        </Field>
        <Field label="Lote">
          <Input value={t('lot')} onChange={(e) => set('lot', e.target.value)} placeholder="opcional" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Fecha">
          <DateInput value={t('injection_date')} onChange={(v) => set('injection_date', v)} />
        </Field>
        <Field label="Hora de atención">
          <DateTimeInput value={t('attended_at')} onChange={(v) => set('attended_at', v)} />
        </Field>
      </div>

      <Field label="Próxima aplicación (opcional)">
        <DateInput value={t('next_due_date')} onChange={(v) => set('next_due_date', v)} />
      </Field>
      <Field label="Notas">
        <Textarea value={t('notes')} onChange={(e) => set('notes', e.target.value)} placeholder="opcional" />
      </Field>

      {isEdit && (
        <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> Eliminar inyección
        </Button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          <Button
            onClick={save}
            loading={create.isPending || update.isPending}
            className="w-full py-3.5"
          >
            <Save className="h-4 w-4" /> {isEdit ? 'Guardar cambios' : 'Registrar inyección'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        danger
        title="¿Eliminar esta inyección?"
        confirmLabel="Eliminar"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
