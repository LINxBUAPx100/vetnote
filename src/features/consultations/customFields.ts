/**
 * Campos personalizados por plantilla.
 *
 * - La plantilla guarda las DEFINICIONES (`custom_fields`, JSON de CustomFieldDef[]).
 * - La consulta guarda una FOTO de los valores capturados (`custom_values`, JSON de
 *   CustomFieldValue[]), con su etiqueta incluida, para que el expediente sea
 *   autocontenido aunque luego cambie o se borre la plantilla.
 */

export type CustomFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select'

export interface CustomFieldDef {
  id: string
  label: string
  type: CustomFieldType
  options?: string[]
  required?: boolean
}

export interface CustomFieldValue {
  label: string
  value: string
}

export const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Texto corto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Lista desplegable' },
]

const VALID_TYPES: CustomFieldType[] = ['text', 'textarea', 'number', 'date', 'select']

export function newFieldId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `f-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

/** Parsea el JSON de definiciones de una plantilla de forma tolerante. */
export function parseFieldDefs(json?: string | null): CustomFieldDef[] {
  if (!json) return []
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x) => x && typeof x.label === 'string')
      .map((x) => ({
        id: typeof x.id === 'string' && x.id ? x.id : newFieldId(),
        label: String(x.label),
        type: VALID_TYPES.includes(x.type) ? (x.type as CustomFieldType) : 'text',
        options: Array.isArray(x.options) ? x.options.map(String) : undefined,
        required: Boolean(x.required),
      }))
  } catch {
    return []
  }
}

/** Parsea el JSON de valores guardados en una consulta. */
export function parseCustomValues(json?: string | null): CustomFieldValue[] {
  if (!json) return []
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x) => x && typeof x.label === 'string')
      .map((x) => ({ label: String(x.label), value: String(x.value ?? '') }))
  } catch {
    return []
  }
}

/** Construye la foto de valores (solo campos con contenido) para guardar en la consulta. */
export function buildCustomValues(
  defs: CustomFieldDef[],
  values: Record<string, string>,
): CustomFieldValue[] {
  return defs
    .map((d) => ({ label: d.label, value: (values[d.id] ?? '').trim() }))
    .filter((x) => x.value !== '')
}
