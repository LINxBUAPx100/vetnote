import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, Check, X, User } from 'lucide-react'
import { Input, Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { ownerService } from '@/services/ownerService'
import { useDebounced } from '@/hooks/useDebounced'
import { ownerSchema, type OwnerForm } from '@/schemas'
import { toast } from '@/stores/uiStore'
import type { Owner } from '@/types/domain'

interface Props {
  value?: Owner | null
  onChange: (owner: Owner | null) => void
}

/** Selecciona un tutor existente (búsqueda) o crea uno nuevo en línea. */
export function OwnerPicker({ value, onChange }: Props) {
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)

  const results = useQuery({
    queryKey: ['owners', 'search', debounced],
    queryFn: () => ownerService.search(debounced),
    enabled: debounced.trim().length >= 2 && !value,
  })

  if (value) {
    return (
      <div className="card flex items-center gap-3 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{value.full_name}</p>
          <p className="truncate text-sm text-content-muted">{value.phone || 'Sin teléfono'}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-sm font-medium text-primary"
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="card space-y-3 p-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'search' ? 'primary' : 'ghost'}
          className="flex-1 px-2 text-sm"
          onClick={() => setMode('search')}
        >
          <Search className="h-4 w-4" /> Buscar tutor
        </Button>
        <Button
          type="button"
          variant={mode === 'create' ? 'primary' : 'ghost'}
          className="flex-1 px-2 text-sm"
          onClick={() => setMode('create')}
        >
          <UserPlus className="h-4 w-4" /> Nuevo tutor
        </Button>
      </div>

      {mode === 'search' ? (
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o teléfono del tutor…"
            aria-label="Buscar tutor"
            autoFocus
          />
          {results.isFetching && <Spinner className="mx-auto" />}
          {results.data && results.data.results.length === 0 && debounced.length >= 2 && (
            <p className="text-sm text-content-muted">
              Sin resultados. Crea un tutor nuevo con la pestaña de arriba.
            </p>
          )}
          <ul className="space-y-1">
            {results.data?.results.map((o) => (
              <li key={o.owner_id}>
                <button
                  type="button"
                  onClick={() => onChange(o)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-background"
                >
                  <Check className="h-4 w-4 text-primary" />
                  <span className="flex-1 truncate">
                    {o.full_name}
                    <span className="text-content-muted"> · {o.phone || 's/tel'}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <InlineOwnerForm onCreated={onChange} onCancel={() => setMode('search')} />
      )}
    </div>
  )
}

function InlineOwnerForm({
  onCreated,
  onCancel,
}: {
  onCreated: (o: Owner) => void
  onCancel: () => void
}) {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerForm>({ resolver: zodResolver(ownerSchema) })

  const create = useMutation({
    mutationFn: (data: OwnerForm) => ownerService.create(data),
    onSuccess: (owner) => {
      qc.invalidateQueries({ queryKey: ['owners'] })
      toast.success('Tutor creado')
      onCreated(owner)
    },
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-2">
      <Field label="Nombre completo" error={errors.full_name?.message}>
        <Input {...register('full_name')} placeholder="Laura Pérez" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Teléfono" error={errors.phone?.message}>
          <Input {...register('phone')} inputMode="tel" placeholder="55 1234 5678" />
        </Field>
        <Field label="Correo" error={errors.email?.message}>
          <Input {...register('email')} inputMode="email" placeholder="opcional" />
        </Field>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={create.isPending} className="flex-1">
          Guardar tutor
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="px-3">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
