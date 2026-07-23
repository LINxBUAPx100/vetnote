import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Field, Input, Textarea, Select } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { OwnerPicker } from '@/features/owners/OwnerPicker'
import { patientSchema, type PatientForm } from '@/schemas'
import { usePatient, useCreatePatient, useUpdatePatient } from './hooks'
import { toast } from '@/stores/uiStore'
import type { Owner } from '@/types/domain'

export function PatientFormPage() {
  const { patientId } = useParams()
  const isEdit = Boolean(patientId)
  const navigate = useNavigate()
  const existing = usePatient(patientId)

  const [owner, setOwner] = useState<Owner | null>(null)
  const create = useCreatePatient()
  const update = useUpdatePatient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: { species: 'canino', sterilized: false },
  })

  // Al cargar en modo edición, precarga valores y tutor.
  useEffect(() => {
    if (isEdit && existing.data) {
      const p = existing.data
      reset({
        name: p.name,
        species: p.species,
        owner_id: p.owner_id,
        breed: p.breed ?? '',
        sex: p.sex,
        birth_date: p.birth_date ?? '',
        approximate_age: p.approximate_age ?? '',
        color: p.color ?? '',
        weight: p.weight ?? '',
        sterilized: Boolean(p.sterilized),
        microchip: p.microchip ?? '',
        clinical_notes: p.clinical_notes ?? '',
      })
      if (existing.data.owner) setOwner(existing.data.owner)
    }
  }, [isEdit, existing.data, reset])

  // Mantiene owner_id sincronizado con el tutor seleccionado.
  useEffect(() => {
    setValue('owner_id', owner?.owner_id ?? '', { shouldValidate: true })
  }, [owner, setValue])

  const onSubmit = async (data: PatientForm) => {
    const payload = { ...data, weight: data.weight === '' ? undefined : data.weight }
    try {
      if (isEdit && patientId) {
        await update.mutateAsync({
          payload: { ...payload, patient_id: patientId },
          expectedUpdatedAt: existing.data?.updated_at,
        })
        toast.success('Paciente actualizado')
        navigate(`/patients/${patientId}`)
      } else {
        const p = await create.mutateAsync(payload)
        toast.success('Paciente registrado')
        navigate(`/patients/${p.patient_id}`)
      }
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (isEdit && existing.isLoading) return <Spinner className="mx-auto mt-10" />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-24">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Editar paciente' : 'Nuevo paciente'}</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-content-muted">Identificación</h2>
        <Field label="Nombre" error={errors.name?.message}>
          <Input {...register('name')} placeholder="Max" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Especie" error={errors.species?.message}>
            <Select {...register('species')}>
              <option value="canino">Canino</option>
              <option value="felino">Felino</option>
              <option value="otro">Otro</option>
            </Select>
          </Field>
          <Field label="Sexo">
            <Select {...register('sex')}>
              <option value="">—</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
              <option value="desconocido">Desconocido</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Raza">
            <Input {...register('breed')} placeholder="Mestizo" />
          </Field>
          <Field label="Color">
            <Input {...register('color')} placeholder="Café" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (kg)" error={errors.weight?.message as string}>
            <Input {...register('weight')} inputMode="decimal" placeholder="18.4" />
          </Field>
          <Field label="Edad aprox.">
            <Input {...register('approximate_age')} placeholder="5 años" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha nacimiento">
            <Input {...register('birth_date')} type="date" />
          </Field>
          <Field label="Microchip">
            <Input {...register('microchip')} placeholder="opcional" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('sterilized')} className="h-4 w-4" />
          Esterilizado/a
        </label>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-content-muted">Tutor</h2>
        <OwnerPicker value={owner} onChange={setOwner} />
        {errors.owner_id && <p className="text-xs text-error">{errors.owner_id.message}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-content-muted">Notas clínicas</h2>
        <Field hint="Alergias, manejo, antecedentes">
          <Textarea {...register('clinical_notes')} placeholder="Observaciones importantes…" />
        </Field>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          <Button
            type="submit"
            loading={create.isPending || update.isPending}
            className="w-full py-3.5"
          >
            {isEdit ? 'Guardar cambios' : 'Registrar paciente'}
          </Button>
        </div>
      </div>
    </form>
  )
}
