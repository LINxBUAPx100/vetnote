import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner, ErrorState } from '@/components/feedback/States'
import { PhoneField } from './PhoneField'
import { ownerService } from '@/services/ownerService'
import { useSettings } from '@/features/consultations/hooks'
import { ownerSchema, type OwnerForm } from '@/schemas'
import { toast } from '@/stores/uiStore'
import { ApiClientError } from '@/types/api'

/** Edición de los datos de un tutor, con control de concurrencia (updated_at). */
export function OwnerEditPage() {
  const { ownerId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const owner = useQuery({
    queryKey: ['owner', ownerId],
    queryFn: () => ownerService.get(ownerId!),
    enabled: Boolean(ownerId),
  })

  const settings = useSettings()
  const defaultCode = settings.data?.country_code?.replace(/\D/g, '') || '52'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OwnerForm>({ resolver: zodResolver(ownerSchema) })

  useEffect(() => {
    if (owner.data) {
      reset({
        full_name: owner.data.full_name,
        phone: owner.data.phone ?? '',
        secondary_phone: owner.data.secondary_phone ?? '',
        email: owner.data.email ?? '',
        address: owner.data.address ?? '',
        notes: owner.data.notes ?? '',
      })
    }
  }, [owner.data, reset])

  const update = useMutation({
    mutationFn: (data: OwnerForm) =>
      ownerService.update({ ...data, owner_id: ownerId! }, owner.data?.updated_at),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['owner', ownerId] })
      qc.invalidateQueries({ queryKey: ['owners'] })
      // El expediente muestra datos del tutor; refréscalos también.
      qc.invalidateQueries({ queryKey: ['patient'] })
      toast.success('Tutor actualizado')
      // Volver a donde el usuario venía (normalmente el expediente).
      navigate(-1)
      void updated
    },
    onError: (e) => {
      if (e instanceof ApiClientError && e.code === 'CONFLICT') {
        toast.error('Este tutor fue modificado desde otro dispositivo. Recargando la versión más reciente.')
        owner.refetch()
      } else {
        toast.error((e as Error).message)
      }
    },
  })

  if (owner.isLoading) return <Spinner className="mx-auto mt-10" />
  if (owner.isError)
    return <ErrorState message={(owner.error as Error).message} onRetry={owner.refetch} />

  return (
    <form onSubmit={handleSubmit((d) => update.mutate(d))} className="space-y-4 pb-24">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Editar tutor</h1>
      </header>

      <Field label="Nombre completo" error={errors.full_name?.message}>
        <Input {...register('full_name')} placeholder="Laura Pérez" autoFocus />
      </Field>
      <Field label="Teléfono" error={errors.phone?.message}>
        <PhoneField
          value={watch('phone') ?? ''}
          onChange={(v) => setValue('phone', v, { shouldDirty: true })}
          defaultCode={defaultCode}
        />
      </Field>
      <Field label="Teléfono secundario" error={errors.secondary_phone?.message}>
        <PhoneField
          value={watch('secondary_phone') ?? ''}
          onChange={(v) => setValue('secondary_phone', v, { shouldDirty: true })}
          defaultCode={defaultCode}
          placeholder="opcional"
        />
      </Field>
      <Field label="Correo" error={errors.email?.message}>
        <Input {...register('email')} inputMode="email" placeholder="opcional" />
      </Field>
      <Field label="Dirección" error={errors.address?.message}>
        <Input {...register('address')} placeholder="opcional" />
      </Field>
      <Field label="Notas" error={errors.notes?.message}>
        <Textarea {...register('notes')} placeholder="Observaciones sobre el tutor…" />
      </Field>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          <Button type="submit" loading={update.isPending} className="w-full py-3.5">
            <Save className="h-4 w-4" /> Guardar cambios
          </Button>
        </div>
      </div>
    </form>
  )
}
