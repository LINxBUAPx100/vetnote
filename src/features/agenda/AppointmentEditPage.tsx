import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Search, PawPrint, X } from 'lucide-react'
import { Field, Input, Textarea, Select, DateTimeInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useDebounced } from '@/hooks/useDebounced'
import { useSearchPatients, usePatient } from '@/features/patients/hooks'
import {
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from './hooks'
import { toast } from '@/stores/uiStore'
import { ApiClientError } from '@/types/api'
import { nowDateTimeLocalValue, fromDateTimeLocalValue } from '@/utils/format'
import type { Appointment, AppointmentState } from '@/types/domain'

type Form = Partial<Appointment>

const STATES: { value: AppointmentState; label: string }[] = [
  { value: 'scheduled', label: 'Programada' },
  { value: 'done', label: 'Atendida' },
  { value: 'cancelled', label: 'Cancelada' },
]

/** Crear / editar una cita de la agenda. */
export function AppointmentEditPage() {
  const { appointmentId } = useParams()
  const isEdit = Boolean(appointmentId)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetPatient = searchParams.get('patientId') ?? undefined

  const existing = useAppointment(appointmentId)
  const create = useCreateAppointment()
  const update = useUpdateAppointment()
  const del = useDeleteAppointment()
  const linkedPatient = usePatient(presetPatient)

  const [form, setForm] = useState<Form>({
    state: 'scheduled',
    scheduled_at: fromDateTimeLocalValue(nowDateTimeLocalValue()),
  })
  const [patientLabel, setPatientLabel] = useState('')
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const search = useSearchPatients(debounced)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (isEdit && existing.data) {
      setForm(existing.data)
    }
  }, [isEdit, existing.data])

  // Prefill del paciente si viene por query (nueva cita desde un expediente).
  useEffect(() => {
    if (!isEdit && presetPatient && linkedPatient.data) {
      setForm((f) => ({
        ...f,
        patient_id: linkedPatient.data.patient_id,
        owner_id: linkedPatient.data.owner?.owner_id,
      }))
      setPatientLabel(linkedPatient.data.name)
    }
  }, [isEdit, presetPatient, linkedPatient.data])

  const set = (name: keyof Form, value: unknown) => setForm((f) => ({ ...f, [name]: value }))
  const t = (k: keyof Form) => (form[k] as string) ?? ''

  const save = async () => {
    if (!t('title').trim()) return toast.error('Ponle un título a la cita')
    if (!t('scheduled_at')) return toast.error('Indica la fecha y hora')
    try {
      if (isEdit) {
        await update.mutateAsync({
          payload: { ...form, appointment_id: appointmentId! } as Partial<Appointment> & {
            appointment_id: string
          },
          expectedUpdatedAt: existing.data?.updated_at,
        })
      } else {
        await create.mutateAsync(form)
      }
      toast.success(isEdit ? 'Cita actualizada' : 'Cita agendada')
      navigate('/agenda')
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'CONFLICT') {
        toast.error('Esta cita fue modificada desde otro dispositivo.')
        existing.refetch()
      } else {
        toast.error((e as Error).message)
      }
    }
  }

  const remove = async () => {
    await del.mutateAsync(appointmentId!)
    toast.success('Cita eliminada')
    navigate('/agenda')
  }

  const selectPatient = (id: string, name: string, ownerId?: string) => {
    set('patient_id', id)
    set('owner_id', ownerId)
    setPatientLabel(name)
    setQuery('')
  }

  const clearPatient = () => {
    set('patient_id', undefined)
    set('owner_id', undefined)
    setPatientLabel('')
  }

  if (isEdit && existing.isLoading) return <Spinner className="mx-auto mt-10" />

  return (
    <div className="space-y-3 pb-28">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Editar cita' : 'Nueva cita'}</h1>
      </header>

      <Field label="Título / motivo">
        <Input
          value={t('title')}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Vacunación, control, cirugía…"
          autoFocus
        />
      </Field>

      <Field label="Fecha y hora">
        <DateTimeInput value={t('scheduled_at')} onChange={(v) => set('scheduled_at', v)} />
      </Field>

      {/* Paciente (opcional) */}
      <div>
        <label className="mb-1 block text-sm font-medium">Mascota (opcional)</label>
        {form.patient_id ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
            <PawPrint className="h-5 w-5 text-primary" />
            <span className="flex-1 truncate text-sm font-medium">{patientLabel || 'Mascota'}</span>
            <button type="button" onClick={clearPatient} aria-label="Quitar mascota">
              <X className="h-4 w-4 text-content-muted" />
            </button>
          </div>
        ) : (
          <>
            <label className="flex min-h-touch items-center gap-2 rounded-xl border border-border bg-surface px-3">
              <Search className="h-5 w-5 text-content-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar mascota…"
                className="border-0 bg-transparent px-0 focus:ring-0"
              />
            </label>
            {debounced.length >= 2 && search.data && search.data.results.length > 0 && (
              <ul className="mt-1 max-h-48 space-y-1 overflow-auto rounded-xl border border-border bg-surface p-1">
                {search.data.results.slice(0, 6).map((pt) => (
                  <li key={pt.patient_id}>
                    <button
                      type="button"
                      onClick={() => selectPatient(pt.patient_id, pt.name, pt.owner_id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-background"
                    >
                      <PawPrint className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 truncate">
                        {pt.name}
                        {pt.owner_name ? (
                          <span className="text-content-muted"> · {pt.owner_name}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <Field label="Notas / comentarios">
        <Textarea value={t('notes')} onChange={(e) => set('notes', e.target.value)} placeholder="opcional" />
      </Field>

      {isEdit && (
        <Field label="Estado">
          <Select value={t('state')} onChange={(e) => set('state', e.target.value)}>
            {STATES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {isEdit && (
        <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> Eliminar cita
        </Button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          <Button
            onClick={save}
            loading={create.isPending || update.isPending}
            className="w-full py-3.5"
          >
            <Save className="h-4 w-4" /> {isEdit ? 'Guardar cambios' : 'Agendar cita'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        danger
        title="¿Eliminar esta cita?"
        confirmLabel="Eliminar"
        loading={del.isPending}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
