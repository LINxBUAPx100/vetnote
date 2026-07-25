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

/** Fecha de HOY en formato `yyyy-MM-dd` (hora local), para inputs type="date". */
export function todayInputValue(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Convierte un ISO a valor para `<input type="datetime-local">`
 * (`yyyy-MM-ddTHH:mm`, hora local). Devuelve '' si no hay valor válido.
 */
export function toDateTimeLocalValue(iso?: string): string {
  if (!iso) return ''
  try {
    const d = parseISO(iso)
    return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm") : ''
  } catch {
    return ''
  }
}

/** Convierte el valor local de un datetime-local a ISO (con zona). */
export function fromDateTimeLocalValue(local: string): string {
  if (!local) return ''
  const d = new Date(local)
  return isValid(d) ? d.toISOString() : local
}

/** Momento actual como valor para datetime-local (`yyyy-MM-ddTHH:mm`, local). */
export function nowDateTimeLocalValue(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm")
}

/** Formatea solo la hora (HH:mm) de un ISO; '' si no es válido. */
export function formatTime(value?: string): string {
  return formatDate(value, 'HH:mm')
}

/**
 * Convierte una edad aproximada escrita ("5 años", "3 meses", "2 años 4 meses",
 * "17") en una fecha de nacimiento estimada (hoy − edad), en `yyyy-MM-dd`.
 * Un número suelto se interpreta como años. Devuelve '' si no puede interpretar.
 */
export function approxAgeToBirthDate(age?: string): string {
  const s = String(age ?? '').toLowerCase().trim()
  if (!s) return ''
  const num = (re: RegExp) => {
    const m = s.match(re)
    return m ? parseInt(m[1] ?? '0', 10) : 0
  }
  let years = num(/(\d+)\s*(?:a[ñn]os?|yr?s?|years?)/)
  const months = num(/(\d+)\s*(?:mes(?:es)?|months?|mo)/)
  const weeks = num(/(\d+)\s*(?:sem(?:anas?)?|weeks?|wk)/)
  const days = num(/(\d+)\s*(?:d[ií]as?|days?)/)
  if (!years && !months && !weeks && !days) {
    const only = s.match(/^(\d+(?:\.\d+)?)$/)
    if (only) years = Math.round(parseFloat(only[1] ?? '0'))
    else return ''
  }
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  d.setMonth(d.getMonth() - months)
  d.setDate(d.getDate() - weeks * 7 - days)
  return isValid(d) ? format(d, 'yyyy-MM-dd') : ''
}

/**
 * Elige la forma según el sexo de la mascota. Para sexo desconocido combina
 * ambas ("atendido/atendida", "él/ella").
 */
export function genderWord(
  sex: string | undefined,
  masculine: string,
  feminine: string,
): string {
  if (sex === 'macho') return masculine
  if (sex === 'hembra') return feminine
  return `${masculine}/${feminine}`
}

/**
 * Normaliza un teléfono a solo dígitos para enlaces tel:/wa.me.
 * Google Sheets puede devolver un teléfono formado solo por dígitos como NÚMERO,
 * por eso forzamos String() antes de operar (evita "replace is not a function").
 */
export function phoneDigits(phone?: string | number | null): string {
  return String(phone ?? '').replace(/\D/g, '')
}

/**
 * Número con lada país para wa.me / tel. Por defecto México (52): a un número
 * local de 10 dígitos le antepone la lada; si ya trae más dígitos se asume que
 * ya incluye la lada y se deja igual.
 */
export function phoneWithCountry(
  phone?: string | number | null,
  countryCode = '52',
): string {
  const d = phoneDigits(phone)
  if (!d) return ''
  return d.length === 10 ? `${countryCode}${d}` : d
}

/**
 * Formato de visualización con "+lada". Un número local de 10 dígitos recibe la
 * lada por defecto; si ya trae lada (11-13 dígitos) se muestra igualmente con +.
 */
export function normalizePhoneDisplay(raw?: string | null, countryCode = '52'): string {
  const s = String(raw ?? '').trim()
  if (!s) return s
  const d = s.replace(/\D/g, '')
  if (d.length === 10) {
    return `+${countryCode} ${d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}`
  }
  if (d.length >= 11 && d.length <= 13) {
    const local = d.slice(-10)
    const code = d.slice(0, d.length - 10)
    return `+${code} ${local.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}`
  }
  return s
}

/**
 * Separa un teléfono en lada (code) y número local. Si no puede detectar lada,
 * `code` es ''. Útil para editar la lada por separado.
 */
export function splitPhone(raw?: string | null): { code: string; local: string } {
  const s = String(raw ?? '').trim()
  if (!s) return { code: '', local: '' }
  const d = s.replace(/\D/g, '')
  if (d.length > 10) return { code: d.slice(0, d.length - 10), local: d.slice(-10) }
  return { code: '', local: d }
}
