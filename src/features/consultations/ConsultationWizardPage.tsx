import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Save, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, DateInput } from '@/components/ui/Field'
import { Spinner } from '@/components/feedback/States'
import { ClinicalTextarea } from './ClinicalTextarea'
import { CustomFieldInputs } from './CustomFieldInputs'
import {
  parseFieldDefs,
  buildCustomValues,
  type CustomFieldDef,
} from './customFields'
import { PatientPicker } from './PatientPicker'
import { NotePreview } from './NotePreview'
import { LazyClinicalNoteCard } from './LazyClinicalNoteCard'
import { SavedActions } from './SavedActions'
import { generateWhatsAppNote } from './noteGenerator'
import {
  useConsultationDraft,
  useTemplates,
  useSettings,
  useCreateConsultation,
} from './hooks'
import { usePatient } from '@/features/patients/hooks'
import { isConsultationEmpty, type ConsultationForm } from '@/schemas'
import { toast } from '@/stores/uiStore'
import { ApiClientError } from '@/types/api'
import type { Consultation, Patient, Template } from '@/types/domain'
import type { PatientSearchResult } from '@/services/patientService'

type FormData = Partial<ConsultationForm>

const STEP_TITLES = [
  'Paciente',
  'Motivo y antecedentes',
  'Signos y examen general',
  'Examen regional',
  'Evaluación y tratamiento',
  'Revisión',
]

export function ConsultationWizardPage() {
  const { patientId: routePatientId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const followUpId = searchParams.get('followUp') ?? undefined

  // Paciente: desde la ruta o seleccionado en el paso 0.
  const routePatient = usePatient(routePatientId)
  const [pickedPatient, setPickedPatient] = useState<Pick<
    Patient,
    'patient_id' | 'name' | 'species' | 'breed' | 'approximate_age' | 'weight'
  > | null>(null)
  const [pickedOwnerName, setPickedOwnerName] = useState<string | undefined>()

  const patient = useMemo(() => {
    if (routePatient.data) {
      return {
        patient_id: routePatient.data.patient_id,
        name: routePatient.data.name,
        species: routePatient.data.species,
        breed: routePatient.data.breed,
        approximate_age: routePatient.data.approximate_age,
        weight: routePatient.data.weight,
        ownerName: routePatient.data.owner?.full_name,
      }
    }
    if (pickedPatient) return { ...pickedPatient, ownerName: pickedOwnerName }
    return null
  }, [routePatient.data, pickedPatient, pickedOwnerName])

  const patientId = patient?.patient_id
  const hasPreselected = Boolean(routePatientId)
  const draftId = `consultation:new:${patientId ?? 'unassigned'}`

  const draft = useConsultationDraft(draftId)
  const templates = useTemplates()
  const settings = useSettings()
  const create = useCreateConsultation()

  const [step, setStep] = useState(hasPreselected ? 1 : 0)
  const [form, setForm] = useState<FormData>({ consultation_type: 'consulta' })
  const [customDefs, setCustomDefs] = useState<CustomFieldDef[]>([])
  const [customVals, setCustomVals] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Consultation | null>(null)

  // Carga el borrador cuando esté listo (separa los campos personalizados).
  useEffect(() => {
    if (draft.ready && draft.initial) {
      const init = draft.initial as Record<string, unknown>
      const { __customDefs, __customVals, ...formPart } = init
      setForm((f) => ({ ...f, ...(formPart as FormData) }))
      if (Array.isArray(__customDefs)) setCustomDefs(__customDefs as CustomFieldDef[])
      if (__customVals && typeof __customVals === 'object') {
        setCustomVals(__customVals as Record<string, string>)
      }
    }
  }, [draft.ready, draft.initial])

  // Persiste form + campos personalizados en el borrador (draft.save va con debounce).
  useEffect(() => {
    if (!draft.ready) return
    draft.save({
      ...form,
      __customDefs: customDefs,
      __customVals: customVals,
    } as unknown as Partial<ConsultationForm>)
  }, [form, customDefs, customVals, draft.ready, draft.save])

  // Si es un seguimiento, marca el tipo y enlaza con la consulta previa.
  useEffect(() => {
    if (followUpId) {
      setForm((f) => ({
        ...f,
        consultation_type: 'follow_up',
        parent_consultation_id: followUpId,
      }))
    }
  }, [followUpId])

  // La persistencia en el borrador la hace el efecto de arriba (con debounce).
  const set = (name: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const setCustomVal = (id: string, value: string) =>
    setCustomVals((prev) => ({ ...prev, [id]: value }))

  const applyTemplate = (tpl: Template) => {
    const keys: (keyof FormData)[] = [
      'reason', 'remote_anamnesis', 'current_anamnesis', 'head_neck',
      'thorax_forelimbs', 'abdomen_hindlimbs_anus_tail', 'treatment',
      'presumptive_diagnosis', 'recommendations',
    ]
    const hasContent = keys.some((k) => typeof form[k] === 'string' && (form[k] as string).trim())
    if (hasContent && !confirm('Se reemplazarán los campos con contenido de la plantilla. ¿Continuar?')) {
      return
    }
    const next = { ...form } as Record<string, unknown>
    keys.forEach((k) => {
      const v = (tpl as unknown as Record<string, unknown>)[k]
      if (typeof v === 'string' && v.trim()) next[k] = v
    })
    setForm(next as FormData)
    // Campos personalizados de la plantilla (se reinician los valores).
    setCustomDefs(parseFieldDefs(tpl.custom_fields))
    setCustomVals({})
    toast.info(`Plantilla “${tpl.name}” aplicada`)
  }

  const consultationWithCustom = useMemo(
    () =>
      ({
        ...form,
        custom_values: JSON.stringify(buildCustomValues(customDefs, customVals)),
      }) as Partial<Consultation>,
    [form, customDefs, customVals],
  )

  const note = useMemo(
    () =>
      generateWhatsAppNote({
        consultation: consultationWithCustom,
        patient: patient
          ? {
              name: patient.name,
              species: patient.species,
              breed: patient.breed,
              approximate_age: patient.approximate_age,
              weight: patient.weight,
            }
          : null,
        owner: patient?.ownerName ? { full_name: patient.ownerName } : null,
        settings: settings.data,
      }),
    [consultationWithCustom, patient, settings.data],
  )

  const save = async () => {
    if (!patientId) return toast.error('Selecciona un paciente primero')
    if (isConsultationEmpty(form)) return toast.error('La consulta no puede estar vacía')
    // El backend sanea y convierte tipos; enviamos el formulario tal cual.
    const payload = {
      ...form,
      patient_id: patientId,
      whatsapp_note: note,
      ...(customDefs.length
        ? { custom_values: JSON.stringify(buildCustomValues(customDefs, customVals)) }
        : {}),
    } as unknown as Partial<Consultation>
    try {
      const result = await create.mutateAsync(payload)
      await draft.clear()
      setSaved(result)
      toast.success('Consulta guardada')
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'NETWORK_ERROR') {
        await draft.clear()
        toast.info('Sin conexión: la consulta quedó en la cola de sincronización.')
        navigate('/settings')
      } else {
        toast.error((e as Error).message)
      }
    }
  }

  // Pantalla post-guardado (comportamiento recursivo, ver docs).
  if (saved && patient) {
    return (
      <SavedActions
        note={note}
        consultation={saved}
        patient={patient}
        settings={settings.data}
      />
    )
  }

  if (routePatientId && routePatient.isLoading) return <Spinner className="mx-auto mt-10" />

  return (
    <div className="space-y-4 pb-28">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold">{STEP_TITLES[step]}</h1>
          <p className="text-xs text-content-muted">
            Paso {step + 1} de {STEP_TITLES.length}
            {patient ? ` · ${patient.name}` : ''}
          </p>
        </div>
        <DraftBadge state={draft.state} pending={create.isPending} />
      </header>

      {/* Barra de progreso navegable: toca un tramo para saltar a ese paso.
          Todos los pasos son opcionales; puedes ir directo a Revisión y guardar. */}
      <div className="flex gap-1">
        {STEP_TITLES.map((title, i) => {
          // No se puede saltar de pasos si aún no hay paciente seleccionado.
          const canJump = Boolean(patientId) && i >= (hasPreselected ? 1 : 0)
          return (
            <button
              key={i}
              type="button"
              disabled={!canJump}
              onClick={() => canJump && setStep(i)}
              aria-label={`Ir a: ${title}`}
              aria-current={i === step ? 'step' : undefined}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-border'
              } ${canJump ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            />
          )
        })}
      </div>

      {/* Atajo: saltar directo a revisión para guardar sin recorrer los pasos. */}
      {patientId && step > 0 && step < 5 && (
        <button
          type="button"
          onClick={() => setStep(5)}
          className="text-sm font-medium text-primary"
        >
          Omitir e ir a revisión →
        </button>
      )}

      {/* Contenido por paso */}
      {step === 0 && (
        <PatientPicker
          onSelect={(p: PatientSearchResult) => {
            setPickedPatient(p)
            setPickedOwnerName(p.owner_name)
            setStep(1)
          }}
        />
      )}

      {step === 1 && (
        <div className="space-y-3">
          <Field label="Plantilla (opcional)">
            <Select
              onChange={(e) => {
                const t = templates.data?.results.find((x) => x.template_id === e.target.value)
                if (t) applyTemplate(t)
                e.target.value = ''
              }}
              defaultValue=""
            >
              <option value="">Elegir plantilla…</option>
              {templates.data?.results.map((t) => (
                <option key={t.template_id} value={t.template_id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>

          {customDefs.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <h2 className="mb-2 text-sm font-semibold text-primary">Campos de la plantilla</h2>
              <CustomFieldInputs defs={customDefs} values={customVals} onChange={setCustomVal} />
            </div>
          )}

          <ClinicalTextarea
            label="Motivo de consulta"
            value={(form.reason as string) ?? ''}
            onChange={(v) => set('reason', v)}
            placeholder="Presenta vómito desde hace dos días."
          />
          <ClinicalTextarea
            label="Anamnesis remota"
            value={(form.remote_anamnesis as string) ?? ''}
            onChange={(v) => set('remote_anamnesis', v)}
            placeholder="Vacunación vigente, sin antecedentes."
          />
          <ClinicalTextarea
            label="Anamnesis actual"
            value={(form.current_anamnesis as string) ?? ''}
            onChange={(v) => set('current_anamnesis', v)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso (kg)">
              <Input
                inputMode="decimal"
                value={(form.weight as string) ?? ''}
                onChange={(e) => set('weight', e.target.value)}
              />
            </Field>
            <Field label="Temperatura (°C)">
              <Input
                inputMode="decimal"
                value={(form.temperature as string) ?? ''}
                onChange={(e) => set('temperature', e.target.value)}
              />
            </Field>
            <Field label="Frec. cardiaca">
              <Input
                inputMode="numeric"
                value={(form.heart_rate as string) ?? ''}
                onChange={(e) => set('heart_rate', e.target.value)}
              />
            </Field>
            <Field label="Frec. respiratoria">
              <Input
                inputMode="numeric"
                value={(form.respiratory_rate as string) ?? ''}
                onChange={(e) => set('respiratory_rate', e.target.value)}
              />
            </Field>
          </div>
          <ClinicalTextarea
            label="Estado general"
            value={(form.general_condition as string) ?? ''}
            onChange={(v) => set('general_condition', v)}
            showPhrases
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mucosas">
              <Input
                value={(form.mucous_membranes as string) ?? ''}
                onChange={(e) => set('mucous_membranes', e.target.value)}
              />
            </Field>
            <Field label="Hidratación">
              <Input
                value={(form.hydration as string) ?? ''}
                onChange={(e) => set('hydration', e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <ClinicalTextarea
            label="Cabeza y cuello"
            value={(form.head_neck as string) ?? ''}
            onChange={(v) => set('head_neck', v)}
            showPhrases
          />
          <ClinicalTextarea
            label="Tórax y miembros anteriores"
            value={(form.thorax_forelimbs as string) ?? ''}
            onChange={(v) => set('thorax_forelimbs', v)}
            showPhrases
          />
          <ClinicalTextarea
            label="Abdomen, MPs, ano y cola"
            value={(form.abdomen_hindlimbs_anus_tail as string) ?? ''}
            onChange={(v) => set('abdomen_hindlimbs_anus_tail', v)}
            showPhrases
          />
          <ClinicalTextarea
            label="Hallazgos adicionales"
            value={(form.additional_exam as string) ?? ''}
            onChange={(v) => set('additional_exam', v)}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <ClinicalTextarea
            label="Diagnóstico presuntivo"
            value={(form.presumptive_diagnosis as string) ?? ''}
            onChange={(v) => set('presumptive_diagnosis', v)}
          />
          <ClinicalTextarea
            label="Diagnósticos diferenciales"
            value={(form.differential_diagnosis as string) ?? ''}
            onChange={(v) => set('differential_diagnosis', v)}
          />
          <ClinicalTextarea
            label="Tratamiento"
            value={(form.treatment as string) ?? ''}
            onChange={(v) => set('treatment', v)}
          />
          <ClinicalTextarea
            label="Recomendaciones"
            value={(form.recommendations as string) ?? ''}
            onChange={(v) => set('recommendations', v)}
            showPhrases
          />
          <Field label="Fecha de seguimiento">
            <DateInput
              value={(form.follow_up_date as string) ?? ''}
              onChange={(v) => set('follow_up_date', v)}
            />
          </Field>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          {isConsultationEmpty(form) && (
            <div className="rounded-xl bg-warning/10 p-3 text-sm text-warning">
              La consulta está prácticamente vacía. Completa al menos un campo clínico.
            </div>
          )}
          <div>
            <h2 className="mb-2 text-sm font-semibold text-content-muted">Nota para WhatsApp</h2>
            <NotePreview note={note} />
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-medium text-primary">
              Vista previa de imagen
            </summary>
            <div className="mt-2">
              <LazyClinicalNoteCard
                consultation={consultationWithCustom}
                patient={patient}
                settings={settings.data}
              />
            </div>
          </details>
        </div>
      )}

      {/* Navegación inferior fija */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-3xl gap-2">
          {step > (hasPreselected ? 1 : 0) && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="px-4">
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
          )}
          {step < 5 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !patientId}
              className="flex-1"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={save} loading={create.isPending} className="flex-1">
              <Save className="h-4 w-4" /> Guardar consulta
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function DraftBadge({ state, pending }: { state: string; pending: boolean }) {
  if (pending)
    return (
      <span className="flex items-center gap-1 text-xs text-content-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…
      </span>
    )
  if (state === 'saving')
    return (
      <span className="flex items-center gap-1 text-xs text-content-muted">
        <CloudOff className="h-3.5 w-3.5" /> Borrador…
      </span>
    )
  if (state === 'saved')
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <Cloud className="h-3.5 w-3.5" /> Borrador guardado
      </span>
    )
  return null
}
