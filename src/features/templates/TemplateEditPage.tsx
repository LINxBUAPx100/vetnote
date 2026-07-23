import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { Field, Input, Textarea, Select } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { templateService } from '@/services/catalogService'
import { useTemplates } from '@/features/consultations/hooks'
import { toast } from '@/stores/uiStore'
import { ApiClientError } from '@/types/api'
import type { Template } from '@/types/domain'

type TemplateForm = Partial<Template>

const TEXT_AREAS: { key: keyof Template; label: string }[] = [
  { key: 'reason', label: 'Motivo de consulta' },
  { key: 'remote_anamnesis', label: 'Anamnesis remota' },
  { key: 'current_anamnesis', label: 'Anamnesis actual' },
  { key: 'head_neck', label: 'Cabeza y cuello' },
  { key: 'thorax_forelimbs', label: 'Tórax y miembros anteriores' },
  { key: 'abdomen_hindlimbs_anus_tail', label: 'Abdomen, MPs, ano y cola' },
  { key: 'treatment', label: 'Tratamiento' },
  { key: 'presumptive_diagnosis', label: 'Diagnóstico presuntivo' },
  { key: 'recommendations', label: 'Recomendaciones' },
]

/** Crear o editar una plantilla desde la web. */
export function TemplateEditPage() {
  const { templateId } = useParams()
  const isEdit = Boolean(templateId)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const templates = useTemplates()

  const [form, setForm] = useState<TemplateForm>({ species: undefined })
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | undefined>()

  // En edición, busca la plantilla en la lista (no hay getTemplate; son pocas).
  useEffect(() => {
    if (isEdit && templates.data) {
      const t = templates.data.results.find((x) => x.template_id === templateId)
      if (t) {
        setForm(t)
        setLoadedUpdatedAt(t.updated_at)
      }
    }
  }, [isEdit, templates.data, templateId])

  const set = (name: keyof TemplateForm, value: unknown) =>
    setForm((f) => ({ ...f, [name]: value }))

  const save = useMutation({
    mutationFn: () => {
      if (!form.name || !form.name.trim()) {
        return Promise.reject(new ApiClientError('El nombre de la plantilla es obligatorio', 'VALIDATION_ERROR'))
      }
      return isEdit
        ? templateService.update(
            { ...form, template_id: templateId! } as Partial<Template> & { template_id: string },
            loadedUpdatedAt,
          )
        : templateService.create(form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast.success(isEdit ? 'Plantilla actualizada' : 'Plantilla creada')
      navigate('/templates')
    },
    onError: (e) => {
      if (e instanceof ApiClientError && e.code === 'CONFLICT') {
        toast.error('Esta plantilla fue modificada desde otro dispositivo. Recargando…')
        templates.refetch()
      } else {
        toast.error((e as Error).message)
      }
    },
  })

  if (isEdit && templates.isLoading) return <Spinner className="mx-auto mt-10" />

  const t = (k: keyof TemplateForm) => (form[k] as string) ?? ''

  return (
    <div className="space-y-3 pb-28">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Editar plantilla' : 'Nueva plantilla'}</h1>
      </header>

      <Field label="Nombre">
        <Input value={t('name')} onChange={(e) => set('name', e.target.value)} placeholder="Consulta general" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          <Input value={t('category')} onChange={(e) => set('category', e.target.value)} placeholder="general" />
        </Field>
        <Field label="Especie">
          <Select value={t('species')} onChange={(e) => set('species', e.target.value || undefined)}>
            <option value="">Todas</option>
            <option value="canino">Canino</option>
            <option value="felino">Felino</option>
            <option value="otro">Otro</option>
          </Select>
        </Field>
      </div>
      <Field label="Descripción">
        <Input value={t('description')} onChange={(e) => set('description', e.target.value)} placeholder="opcional" />
      </Field>

      {TEXT_AREAS.map(({ key, label }) => (
        <Field key={key} label={label}>
          <Textarea value={t(key)} onChange={(e) => set(key, e.target.value)} />
        </Field>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          <Button onClick={() => save.mutate()} loading={save.isPending} className="w-full py-3.5">
            <Save className="h-4 w-4" /> {isEdit ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </div>
      </div>
    </div>
  )
}
