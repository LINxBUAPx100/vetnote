import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { Field, Input, Textarea, Select, DateInput, DateTimeInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useCarnetEntry, useCreateCarnetEntry, useUpdateCarnetEntry } from './hooks'
import { carnetService } from '@/services/carnetService'
import { toast } from '@/stores/uiStore'
import { ApiClientError } from '@/types/api'
import { nowDateTimeLocalValue, fromDateTimeLocalValue, todayInputValue } from '@/utils/format'
import type { CarnetCategory, CarnetEntry } from '@/types/domain'

type Form = Partial<CarnetEntry>

const CATEGORIES: { value: CarnetCategory; label: string }[] = [
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'desparasitacion', label: 'Desparasitación' },
  { value: 'otro', label: 'Otro' },
]

/** Crear / editar una entrada del carnet sanitario. */
export function CarnetEntryEditPage() {
  const { patientId, entryId } = useParams()
  const isEdit = Boolean(entryId)
  const navigate = useNavigate()
  const existing = useCarnetEntry(entryId)
  const create = useCreateCarnetEntry()
  const update = useUpdateCarnetEntry()

  const [form, setForm] = useState<Form>({
    category: 'vacuna',
    application_date: todayInputValue(),
    attended_at: fromDateTimeLocalValue(nowDateTimeLocalValue()),
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (isEdit && existing.data) setForm(existing.data)
  }, [isEdit, existing.data])

  const set = (name: keyof Form, value: unknown) => setForm((f) => ({ ...f, [name]: value }))
  const t = (k: keyof Form) => (form[k] as string) ?? ''
  const targetPatient = patientId ?? existing.data?.patient_id
  const backTo = targetPatient ? `/carnet/${targetPatient}` : '/carnet'

  const save = async () => {
    if (!t('product').trim()) return toast.error('Indica el producto (vacuna/antiparasitario)')
    try {
      if (isEdit) {
        await update.mutateAsync({
          payload: { ...form, entry_id: entryId! } as Partial<CarnetEntry> & { entry_id: string },
          expectedUpdatedAt: existing.data?.updated_at,
        })
      } else {
        if (!targetPatient) return toast.error('Falta el paciente')
        await create.mutateAsync({ ...form, patient_id: targetPatient })
      }
      toast.success(isEdit ? 'Entrada actualizada' : 'Entrada agregada al carnet')
      navigate(backTo)
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'CONFLICT') {
        toast.error('Esta entrada fue modificada desde otro dispositivo.')
        existing.refetch()
      } else {
        toast.error((e as Error).message)
      }
    }
  }

  const remove = async () => {
    await carnetService.softDelete(entryId!)
    toast.success('Entrada eliminada')
    navigate(backTo)
  }

  if (isEdit && existing.isLoading) return <Spinner className="mx-auto mt-10" />

  return (
    <div className="space-y-3 pb-28">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Editar entrada' : 'Nueva entrada de carnet'}</h1>
      </header>

      <Field label="Tipo">
        <Select value={t('category')} onChange={(e) => set('category', e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Producto">
        <Input
          value={t('product')}
          onChange={(e) => set('product', e.target.value)}
          placeholder="Ej. Vacuna múltiple, Rabia, Antiparasitario…"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Laboratorio / marca">
          <Input value={t('manufacturer')} onChange={(e) => set('manufacturer', e.target.value)} placeholder="opcional" />
        </Field>
        <Field label="Lote">
          <Input value={t('lot')} onChange={(e) => set('lot', e.target.value)} placeholder="opcional" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Fecha de aplicación">
          <DateInput value={t('application_date')} onChange={(v) => set('application_date', v)} />
        </Field>
        <Field label="Hora de atención">
          <DateTimeInput value={t('attended_at')} onChange={(v) => set('attended_at', v)} />
        </Field>
      </div>

      <Field label="Próxima dosis / refuerzo">
        <DateInput value={t('next_due_date')} onChange={(v) => set('next_due_date', v)} />
      </Field>
      <Field label="Notas">
        <Textarea value={t('notes')} onChange={(e) => set('notes', e.target.value)} placeholder="opcional" />
      </Field>

      {isEdit && (
        <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> Eliminar entrada
        </Button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          <Button
            onClick={save}
            loading={create.isPending || update.isPending}
            className="w-full py-3.5"
          >
            <Save className="h-4 w-4" /> {isEdit ? 'Guardar cambios' : 'Agregar al carnet'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        danger
        title="¿Eliminar esta entrada?"
        confirmLabel="Eliminar"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
