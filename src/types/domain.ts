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
  /** Hora de atención (ISO datetime) registrada manual o automáticamente. */
  attended_at?: string
  /** Tratamiento estructurado (JSON de TreatmentItem[]). */
  treatment_items?: string
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

/** Estudio complementario (laboratorio, imagenología, etc.). */
export interface Study {
  study_id: string
  patient_id: string
  study_type?: string
  study_date: string
  attended_at?: string
  request_reason?: string
  findings?: string
  interpretation?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
  status: RecordStatus
}

/** Registro de inyección / aplicación parenteral. */
export interface Injection {
  injection_id: string
  patient_id: string
  product: string
  dose?: string
  route?: string
  site?: string
  injection_date: string
  attended_at?: string
  lot?: string
  next_due_date?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
  status: RecordStatus
}

export type CarnetCategory = 'vacuna' | 'desparasitacion' | 'otro'

/** Entrada del carnet sanitario (vacunas, desparasitaciones, etc.). */
export interface CarnetEntry {
  entry_id: string
  patient_id: string
  category: CarnetCategory
  product: string
  lot?: string
  manufacturer?: string
  application_date: string
  attended_at?: string
  next_due_date?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
  status: RecordStatus
}

export type AppointmentState = 'scheduled' | 'done' | 'cancelled'

/** Cita agendada (agenda). */
export interface Appointment {
  appointment_id: string
  patient_id?: string
  owner_id?: string
  title: string
  scheduled_at: string
  duration_min?: number
  reason?: string
  notes?: string
  state: AppointmentState
  created_at: string
  updated_at: string
  created_by?: string
  status: RecordStatus
}

/** Ítem de tratamiento estructurado (medicamento + posología). */
export interface TreatmentItem {
  name: string
  medication_id?: string
  dose?: string
  route?: string
  frequency?: string
  duration?: string
  notes?: string
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
