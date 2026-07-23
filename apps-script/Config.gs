/**
 * Config.gs — Constantes centrales del backend VetNote.
 * Aunque Apps Script muestra los archivos de forma plana, mantenemos la
 * separación por responsabilidad. Ver docs/02-modelo-datos.md.
 */

var CONFIG = {
  SCHEMA_VERSION: '1',
  // Clave en Script Properties donde vive el token compartido de la app.
  TOKEN_PROPERTY: 'APP_TOKEN',
  // Rate limiting básico por CacheService.
  RATE_LIMIT_WINDOW_SEC: 60,
  RATE_LIMIT_MAX: 60, // peticiones por ventana e IP-cliente
  // Duración máxima del lock de escritura.
  LOCK_TIMEOUT_MS: 8000,
  // Cache de catálogos (settings, medications, templates).
  CATALOG_CACHE_SEC: 300,
  // Paginación por defecto.
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  // Longitud máxima de campos de texto (sanitización).
  MAX_TEXT_LEN: 5000,
}

/** Nombres de las hojas (fuente de verdad). */
var SHEETS = {
  PATIENTS: 'Patients',
  OWNERS: 'Owners',
  CONSULTATIONS: 'Consultations',
  TEMPLATES: 'Templates',
  MEDICATIONS: 'Medications',
  USERS: 'Users',
  SETTINGS: 'Settings',
  AUDIT: 'AuditLog',
}

/**
 * Encabezados por hoja. El ORDEN define las columnas. El repositorio trabaja
 * siempre por nombre de columna, nunca por índice fijo codificado a mano.
 */
var HEADERS = {
  Patients: [
    'patient_id', 'owner_id', 'name', 'species', 'breed', 'sex', 'birth_date',
    'approximate_age', 'color', 'weight', 'sterilized', 'microchip',
    'clinical_notes', 'created_at', 'updated_at', 'created_by', 'status',
  ],
  Owners: [
    'owner_id', 'full_name', 'phone', 'secondary_phone', 'email', 'address',
    'notes', 'created_at', 'updated_at', 'status',
  ],
  Consultations: [
    'consultation_id', 'patient_id', 'parent_consultation_id', 'consultation_type',
    'consultation_date', 'reason', 'remote_anamnesis', 'current_anamnesis',
    'general_condition', 'temperature', 'heart_rate', 'respiratory_rate', 'weight',
    'mucous_membranes', 'hydration', 'head_neck', 'thorax_forelimbs',
    'abdomen_hindlimbs_anus_tail', 'additional_exam', 'treatment',
    'presumptive_diagnosis', 'differential_diagnosis', 'recommendations',
    'follow_up_date', 'whatsapp_note', 'created_at', 'updated_at', 'created_by',
    'status',
  ],
  Templates: [
    'template_id', 'name', 'description', 'species', 'category', 'reason',
    'remote_anamnesis', 'current_anamnesis', 'head_neck', 'thorax_forelimbs',
    'abdomen_hindlimbs_anus_tail', 'treatment', 'presumptive_diagnosis',
    'recommendations', 'created_at', 'updated_at', 'status',
  ],
  Medications: [
    'medication_id', 'generic_name', 'commercial_name', 'presentation',
    'concentration', 'route', 'default_instructions', 'notes', 'created_at',
    'updated_at', 'status',
  ],
  Users: [
    'user_id', 'name', 'email', 'role', 'access_token_hash', 'created_at',
    'last_access', 'status',
  ],
  Settings: ['setting_key', 'setting_value', 'description', 'updated_at'],
  AuditLog: [
    'log_id', 'timestamp', 'user_id', 'action', 'entity_type', 'entity_id',
    'summary', 'request_id', 'success', 'error_message',
  ],
}

/**
 * Columnas realmente numéricas. El resto de valores numéricos que devuelva
 * Sheets (p.ej. teléfonos de solo dígitos) se convierten a texto al leer.
 */
var NUMERIC_FIELDS = {
  weight: true,
  temperature: true,
  heart_rate: true,
  respiratory_rate: true,
}

/** Columna identificadora por hoja (para búsquedas por id). */
var ID_COLUMN = {
  Patients: 'patient_id',
  Owners: 'owner_id',
  Consultations: 'consultation_id',
  Templates: 'template_id',
  Medications: 'medication_id',
  Users: 'user_id',
  Settings: 'setting_key',
  AuditLog: 'log_id',
}
