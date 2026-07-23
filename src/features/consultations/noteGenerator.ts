import type { Consultation, Patient, Owner, ClinicSettings } from '@/types/domain'
import { formatDate } from '@/utils/format'

/**
 * Genera el texto de la consulta con formato de WhatsApp.
 * - Omite campos opcionales vacíos.
 * - Mantiene los títulos obligatorios del formato clínico.
 * - Conserva el formato de negritas (*...*) y cursivas (_..._) de WhatsApp.
 * Servicio puro: sin dependencias de React, fácil de probar.
 */

export interface NoteOptions {
  includeOwner?: boolean
  includeClinic?: boolean
}

interface NoteInput {
  consultation: Partial<Consultation>
  patient?: Pick<Patient, 'name' | 'species' | 'breed' | 'approximate_age' | 'weight'> | null
  owner?: Pick<Owner, 'full_name'> | null
  settings?: ClinicSettings | null
}

function line(label: string, value?: string | number): string | null {
  const v = value === undefined || value === null ? '' : String(value).trim()
  return v ? `${label} ${v}` : null
}

export function generateWhatsAppNote(input: NoteInput, options: NoteOptions = {}): string {
  const { consultation: c, patient, owner, settings } = input
  const includeOwner = options.includeOwner ?? true
  const includeClinic = options.includeClinic ?? false
  const parts: string[] = []

  // Identificación
  const idLines: string[] = []
  if (patient) {
    idLines.push(...([
      line('Paciente:', patient.name),
      line('Especie:', capitalize(patient.species)),
      patient.breed ? line('Raza:', patient.breed) : null,
      patient.approximate_age ? line('Edad:', patient.approximate_age) : null,
      typeof patient.weight === 'number' && patient.weight > 0
        ? line('Peso:', `${patient.weight} kg`)
        : null,
    ].filter(Boolean) as string[]))
  }
  if (includeOwner && owner?.full_name) idLines.push(`Tutor: ${owner.full_name}`)
  parts.push(`*Identificación:*${idLines.length ? '\n' + idLines.join('\n') : ''}`)

  // Bloques principales (título obligatorio + contenido si existe)
  pushBlock(parts, '*📋 Motivo de consulta:*', c.reason)
  pushBlock(parts, '*📗 Anamnesis remota:*', c.remote_anamnesis)
  pushBlock(parts, '*📘 Anamnesis actual:*', c.current_anamnesis)

  // Examen físico
  const exam: string[] = []
  const cabeza = str(c.head_neck)
  const torax = str(c.thorax_forelimbs)
  const abdomen = str(c.abdomen_hindlimbs_anus_tail)
  const adicional = str(c.additional_exam)
  if (cabeza || torax || abdomen || adicional) {
    exam.push('*🩺 Examen físico:*')
    if (cabeza) exam.push(`\n_Cabeza y cuello:_\n${cabeza}`)
    if (torax) exam.push(`\n_Tórax y MAs:_\n${torax}`)
    if (abdomen) exam.push(`\n_Abdomen, MPs, ano y cola:_\n${abdomen}`)
    if (adicional) exam.push(`\n_Hallazgos adicionales:_\n${adicional}`)
    parts.push(exam.join('\n'))
  }

  pushBlock(parts, '*🩹 Tratamiento:*', c.treatment)
  pushBlock(parts, '*📌 Diagnóstico presuntivo:*', c.presumptive_diagnosis)
  pushBlock(parts, '*🔬 Diagnósticos diferenciales:*', c.differential_diagnosis, true)
  pushBlock(parts, '*📎 Recomendaciones:*', c.recommendations, true)

  if (c.follow_up_date) {
    parts.push(`*📅 Seguimiento:*\n${formatDate(c.follow_up_date)}`)
  }

  // Pie de clínica opcional
  if (includeClinic && settings) {
    const clinic: string[] = []
    if (settings.clinic_name) clinic.push(settings.clinic_name)
    if (settings.vet_name) clinic.push(settings.vet_name)
    if (settings.phone) clinic.push(settings.phone)
    if (settings.note_footer) clinic.push(settings.note_footer)
    if (clinic.length) parts.push('—\n' + clinic.join('\n'))
  }

  return parts.join('\n\n').trim()
}

/**
 * Coerce a texto de forma segura. Google Sheets puede devolver campos que solo
 * contienen dígitos como número; String() evita "x.trim is not a function".
 */
function str(value?: string | number | null): string {
  return value === null || value === undefined ? '' : String(value).trim()
}

function pushBlock(
  parts: string[],
  title: string,
  value?: string | number | null,
  onlyIfPresent = false,
): void {
  const v = str(value)
  if (onlyIfPresent && !v) return
  parts.push(v ? `${title}\n${v}` : title)
}

function capitalize(s?: string): string {
  const v = str(s)
  if (!v) return ''
  return v.charAt(0).toUpperCase() + v.slice(1)
}
