import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

/** Formatea una fecha ISO a texto legible en español. Tolerante a valores vacíos. */
export function formatDate(value?: string, pattern = "d 'de' MMMM yyyy"): string {
  if (!value) return ''
  try {
    const d = typeof value === 'string' ? parseISO(value) : new Date(value)
    return isValid(d) ? format(d, pattern, { locale: es }) : String(value)
  } catch {
    return String(value)
  }
}

export function formatDateTime(value?: string): string {
  return formatDate(value, "d MMM yyyy, HH:mm")
}

/**
 * Normaliza un teléfono a solo dígitos para enlaces tel:/wa.me.
 * Google Sheets puede devolver un teléfono formado solo por dígitos como NÚMERO,
 * por eso forzamos String() antes de operar (evita "replace is not a function").
 */
export function phoneDigits(phone?: string | number | null): string {
  return String(phone ?? '').replace(/\D/g, '')
}
