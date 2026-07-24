import { z } from 'zod'

const optionalText = (max = 5000) => z.string().trim().max(max).optional().or(z.literal(''))

export const ownerSchema = z.object({
  full_name: z.string().trim().min(1, 'El nombre del tutor es obligatorio').max(150),
  phone: optionalText(40),
  secondary_phone: optionalText(40),
  email: z.string().trim().email('Correo no válido').max(120).optional().or(z.literal('')),
  address: optionalText(300),
  notes: optionalText(),
})
export type OwnerForm = z.infer<typeof ownerSchema>

export const speciesEnum = z.enum(['canino', 'felino', 'otro'])
export const sexEnum = z.enum(['macho', 'hembra', 'desconocido'])

// Un <select> con opción "—" devuelve '' (cadena vacía). Para campos opcionales
// tratamos '' como "sin valor" (undefined) antes de validar el enum.
const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v)

// Número opcional: '' o null -> undefined; cualquier otra cosa se convierte a número.
const optionalNumber = (message?: string) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ invalid_type_error: 'Debe ser un número' }).nonnegative(message).optional(),
  )

export const patientSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del paciente es obligatorio').max(100),
  species: speciesEnum,
  owner_id: z.string().min(1, 'Debes seleccionar o crear un tutor'),
  breed: optionalText(80),
  sex: z.preprocess(emptyToUndefined, sexEnum.optional()),
  birth_date: optionalText(30),
  approximate_age: optionalText(40),
  color: optionalText(60),
  weight: optionalNumber('El peso no puede ser negativo'),
  sterilized: z.boolean().optional(),
  microchip: optionalText(60),
  clinical_notes: optionalText(),
})
export type PatientForm = z.infer<typeof patientSchema>

// Consulta: todos los campos clínicos son opcionales de forma individual, pero
// no se permite guardar una consulta completamente vacía (se valida aparte).
export const consultationSchema = z.object({
  patient_id: z.string().min(1),
  consultation_type: z.enum(['consulta', 'follow_up']).default('consulta'),
  parent_consultation_id: optionalText(60),
  consultation_date: optionalText(30),
  attended_at: optionalText(40),
  treatment_items: optionalText(20000),
  reason: optionalText(),
  remote_anamnesis: optionalText(),
  current_anamnesis: optionalText(),
  general_condition: optionalText(),
  temperature: z.union([z.coerce.number(), z.literal('')]).optional(),
  heart_rate: z.union([z.coerce.number(), z.literal('')]).optional(),
  respiratory_rate: z.union([z.coerce.number(), z.literal('')]).optional(),
  weight: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  mucous_membranes: optionalText(),
  hydration: optionalText(),
  head_neck: optionalText(),
  thorax_forelimbs: optionalText(),
  abdomen_hindlimbs_anus_tail: optionalText(),
  additional_exam: optionalText(),
  treatment: optionalText(),
  presumptive_diagnosis: optionalText(),
  differential_diagnosis: optionalText(),
  recommendations: optionalText(),
  follow_up_date: optionalText(30),
})
export type ConsultationForm = z.infer<typeof consultationSchema>

const CLINICAL_KEYS: (keyof ConsultationForm)[] = [
  'reason', 'current_anamnesis', 'presumptive_diagnosis', 'treatment',
  'head_neck', 'thorax_forelimbs', 'abdomen_hindlimbs_anus_tail', 'recommendations',
]

/** Una consulta debe tener al menos un campo clínico con contenido. */
export function isConsultationEmpty(form: Partial<ConsultationForm>): boolean {
  return !CLINICAL_KEYS.some((k) => {
    const v = form[k]
    return typeof v === 'string' && v.trim() !== ''
  })
}
