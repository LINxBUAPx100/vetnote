/**
 * Modelo de dominio de VetNote. Refleja las columnas de las hojas de
 * Google Sheets (ver docs/02-modelo-datos.md). Todos los IDs son UUID.
 */

export type RecordStatus = 'active' | 'inactive' | 'deleted'
export type Species = 'canino' | 'felino' | 'otro'
export type Sex = 'macho' | 'hembra' | 'desconocido'
export type ConsultationType = 'consulta' | 'follow_up'

export interface Owner {
  owner_id: string
  full_name: string
  phone: string
  secondary_phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
  updated_at: string
  status: RecordStatus
}

export interface Patient {
  patient_id: string
  owner_id: string
  name: string
  species: Species
  breed?: string
  sex?: Sex
  birth_date?: string
  approximate_age?: string
  color?: string
  weight?: number
  sterilized?: boolean
  microchip?: string
  clinical_notes?: string
  created_at: string
  updated_at: string
  created_by?: string
  status: RecordStatus
}

export interface Consultation {
  consultation_id: string
  patient_id: string
  /** Referencia a la consulta previa cuando es un seguimiento. */
  parent_consultation_id?: string
  consultation_type: ConsultationType
  consultation_date: string
  reason?: string
  remote_anamnesis?: string
  current_anamnesis?: string
  general_condition?: string
  temperature?: number
  heart_rate?: number
  respiratory_rate?: number
  weight?: number
  mucous_membranes?: string
  hydration?: string
  head_neck?: string
  thorax_forelimbs?: string
  abdomen_hindlimbs_anus_tail?: string
  additional_exam?: string
  treatment?: string
  presumptive_diagnosis?: string
  differential_diagnosis?: string
  recommendations?: string
  follow_up_date?: string
  /** Copia exacta del texto enviado a WhatsApp en su momento. */
  whatsapp_note?: string
  /** Foto JSON de los campos personalizados de la plantilla (CustomFieldValue[]). */
  custom_values?: string
  created_at: string
  updated_at: string
  created_by?: string
  status: RecordStatus
}

export interface Template {
  template_id: string
  name: string
  description?: string
  species?: Species
  category?: string
  reason?: string
  remote_anamnesis?: string
  current_anamnesis?: string
  head_neck?: string
  thorax_forelimbs?: string
  abdomen_hindlimbs_anus_tail?: string
  treatment?: string
  presumptive_diagnosis?: string
  recommendations?: string
  /** Definiciones JSON de campos personalizados (CustomFieldDef[]). */
  custom_fields?: string
  created_at: string
  updated_at: string
  status: RecordStatus
}

export interface Medication {
  medication_id: string
  generic_name: string
  commercial_name?: string
  presentation?: string
  concentration?: string
  route?: string
  default_instructions?: string
  notes?: string
  created_at: string
  updated_at: string
  status: RecordStatus
}

export interface ClinicSettings {
  clinic_name?: string
  vet_name?: string
  professional_id?: string
  phone?: string
  address?: string
  logo?: string
  primary_color?: string
  note_footer?: string
  date_format?: string
  id_prefix?: string
  schema_version?: string
  [key: string]: string | undefined
}

/** Resultado del healthCheck del backend. */
export interface HealthCheckResult {
  status: 'ok'
  schemaVersion: string
  sheets: Record<string, boolean>
  serverTime: string
}
