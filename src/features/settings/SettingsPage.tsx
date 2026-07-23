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

const FIELDS: { key: keyof ClinicSettings; label: string; area?: boolean }[] = [
  { key: 'clinic_name', label: 'Nombre de la clínica' },
  { key: 'vet_name', label: 'Nombre de la veterinaria' },
  { key: 'professional_id', label: 'Cédula profesional' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'address', label: 'Dirección' },
  { key: 'note_footer', label: 'Texto de pie de nota', area: true },
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

  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Datos de la clínica</h2>
      <p className="text-sm text-content-muted">
        Estos datos aparecen en las notas e imágenes clínicas.
      </p>

      {settings.isLoading ? (
        <Spinner className="mx-auto mt-4" />
      ) : (
        <>
          <div className="space-y-3">
            {FIELDS.map(({ key, label, area }) => (
              <Field key={String(key)} label={label}>
                {area ? (
                  <Textarea
                    value={form[key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                ) : (
                  <Input
                    value={form[key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                )}
              </Field>
            ))}
          </div>

          <Button onClick={() => save.mutate(form)} loading={save.isPending} className="w-full">
            <Save className="h-4 w-4" /> Guardar
          </Button>
        </>
      )}
    </section>
  )
}
