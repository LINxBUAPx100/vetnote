import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, CheckCircle2 } from 'lucide-react'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/feedback/States'
import { useSettings } from '@/features/consultations/hooks'
import { settingsService } from '@/services/catalogService'
import { toast } from '@/stores/uiStore'
import type { ClinicSettings } from '@/types/domain'

type FieldKind = 'text' | 'area' | 'color'
interface SettingField {
  key: keyof ClinicSettings
  label: string
  kind?: FieldKind
  hint?: string
  placeholder?: string
}

const SECTIONS: { title: string; description?: string; fields: SettingField[] }[] = [
  {
    title: 'Identidad de la clínica',
    description: 'Aparece en las notas e imágenes clínicas.',
    fields: [
      { key: 'clinic_name', label: 'Nombre de la clínica', placeholder: 'VETERINARIA LOVET' },
      { key: 'vet_name', label: 'Nombre de la veterinaria', placeholder: 'MVZ. Nombre Apellido' },
      { key: 'professional_id', label: 'Cédula profesional' },
      { key: 'primary_color', label: 'Color de marca', kind: 'color', hint: 'Acento de la imagen' },
    ],
  },
  {
    title: 'Contacto',
    fields: [
      { key: 'country_code', label: 'Lada por defecto', hint: 'Para WhatsApp/llamadas', placeholder: '52' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'whatsapp', label: 'WhatsApp (si es distinto)', placeholder: 'opcional' },
      { key: 'email', label: 'Correo', placeholder: 'opcional' },
      { key: 'website', label: 'Sitio web / redes', placeholder: 'opcional' },
      { key: 'address', label: 'Dirección' },
      { key: 'city', label: 'Ciudad / localidad', placeholder: 'opcional' },
    ],
  },
  {
    title: 'Atención y notas',
    fields: [
      { key: 'schedule', label: 'Horario de atención', kind: 'area', placeholder: 'Lun–Vie 9:00–19:00\nSáb 9:00–14:00' },
      { key: 'note_footer', label: 'Texto de pie de nota', kind: 'area', placeholder: 'Tratamientos con amor' },
    ],
  },
]

export function SettingsPage() {
  return (
    <div className="space-y-8 pb-6">
      <h1 className="text-xl font-bold">Configuración</h1>

      <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
        <CheckCircle2 className="h-4 w-4" />
        Datos guardados en la nube (Firebase) · se sincronizan solos
      </div>

      <ClinicSection />
    </div>
  )
}

/** Datos de la clínica que aparecen en notas e imágenes. */
function ClinicSection() {
  const qc = useQueryClient()
  const settings = useSettings()
  const [form, setForm] = useState<ClinicSettings>({})

  useEffect(() => {
    if (settings.data) setForm(settings.data)
  }, [settings.data])

  const save = useMutation({
    mutationFn: (payload: Partial<ClinicSettings>) => settingsService.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Configuración guardada')
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const set = (key: keyof ClinicSettings, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  if (settings.isLoading) return <Spinner className="mx-auto mt-4" />

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => (
        <section key={section.title} className="space-y-3">
          <div>
            <h2 className="font-semibold">{section.title}</h2>
            {section.description && (
              <p className="text-sm text-content-muted">{section.description}</p>
            )}
          </div>
          <div className="space-y-3">
            {section.fields.map(({ key, label, kind, hint, placeholder }) => (
              <Field key={String(key)} label={label} hint={hint}>
                {kind === 'area' ? (
                  <Textarea
                    value={form[key] ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                  />
                ) : kind === 'color' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form[key] || '#3A8FE0'}
                      onChange={(e) => set(key, e.target.value)}
                      className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-surface"
                      aria-label={label}
                    />
                    <Input
                      value={form[key] ?? ''}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder="#3A8FE0"
                    />
                  </div>
                ) : (
                  <Input
                    value={form[key] ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                  />
                )}
              </Field>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface/90 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <Button onClick={() => save.mutate(form)} loading={save.isPending} className="w-full">
          <Save className="h-4 w-4" /> Guardar configuración
        </Button>
      </div>
    </div>
  )
}
