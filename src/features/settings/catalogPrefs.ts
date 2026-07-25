/**
 * Listas administrables de razas y colores.
 *
 * Las listas base viven en el código (`breeds.ts`) y la clínica puede
 * personalizarlas desde Configuración:
 *   - `custom_*`  → entradas añadidas por la doctora.
 *   - `hidden_*`  → entradas base ocultadas (no se borran del código, así que
 *                   siempre se pueden recuperar).
 *
 * Ambas se guardan como JSON dentro del documento `settings/clinic`.
 */
import { DOG_BREEDS, CAT_BREEDS, COLORS } from '@/features/patients/breeds'
import type { ClinicSettings, Species } from '@/types/domain'

export type CatalogKind = 'dog_breeds' | 'cat_breeds' | 'colors'

export const CATALOG_META: Record<CatalogKind, { label: string; base: string[]; hint: string }> = {
  dog_breeds: { label: 'Razas caninas', base: DOG_BREEDS, hint: 'Sugerencias al registrar un perro' },
  cat_breeds: { label: 'Razas felinas', base: CAT_BREEDS, hint: 'Sugerencias al registrar un gato' },
  colors: { label: 'Colores', base: COLORS, hint: 'Sugerencias de color de capa' },
}

const customKey = (k: CatalogKind) => `custom_${k}` as keyof ClinicSettings
const hiddenKey = (k: CatalogKind) => `hidden_${k}` as keyof ClinicSettings

/** Parsea una lista JSON guardada en settings de forma tolerante. */
function parseList(raw?: string): string[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.map(String).filter((s) => s.trim()) : []
  } catch {
    return []
  }
}

const norm = (s: string) => s.trim().toLowerCase()

/** Lista efectiva = (base − ocultas) + personalizadas, sin duplicados. */
export function resolveCatalog(kind: CatalogKind, settings?: ClinicSettings | null): string[] {
  const custom = parseList(settings?.[customKey(kind)])
  const hidden = new Set(parseList(settings?.[hiddenKey(kind)]).map(norm))
  const base = CATALOG_META[kind].base.filter((v) => !hidden.has(norm(v)))

  const seen = new Set(base.map(norm))
  const extras = custom.filter((v) => {
    if (seen.has(norm(v))) return false
    seen.add(norm(v))
    return true
  })
  // Las personalizadas se muestran primero: son las que la clínica usa a diario.
  return [...extras, ...base]
}

/** Razas efectivas según especie. */
export function resolveBreeds(species: Species | undefined, settings?: ClinicSettings | null) {
  if (species === 'felino') return resolveCatalog('cat_breeds', settings)
  if (species === 'canino') return resolveCatalog('dog_breeds', settings)
  return []
}

/** Indica si un valor viene de la lista base (no se borra: se oculta). */
export function isBaseEntry(kind: CatalogKind, value: string): boolean {
  return CATALOG_META[kind].base.some((v) => norm(v) === norm(value))
}

/**
 * Calcula los campos de settings tras AÑADIR un valor. Si estaba oculto lo
 * vuelve a mostrar en lugar de duplicarlo.
 */
export function addEntry(
  kind: CatalogKind,
  value: string,
  settings?: ClinicSettings | null,
): Partial<ClinicSettings> {
  const v = value.trim()
  if (!v) return {}

  const hidden = parseList(settings?.[hiddenKey(kind)])
  if (hidden.some((h) => norm(h) === norm(v))) {
    return { [hiddenKey(kind)]: JSON.stringify(hidden.filter((h) => norm(h) !== norm(v))) }
  }

  if (isBaseEntry(kind, v)) return {} // ya visible en la base
  const custom = parseList(settings?.[customKey(kind)])
  if (custom.some((c) => norm(c) === norm(v))) return {} // ya existe
  return { [customKey(kind)]: JSON.stringify([...custom, v]) }
}

/**
 * Calcula los campos de settings tras QUITAR un valor: si es de la base se
 * oculta; si es personalizado se elimina.
 */
export function removeEntry(
  kind: CatalogKind,
  value: string,
  settings?: ClinicSettings | null,
): Partial<ClinicSettings> {
  const custom = parseList(settings?.[customKey(kind)])
  if (custom.some((c) => norm(c) === norm(value))) {
    return { [customKey(kind)]: JSON.stringify(custom.filter((c) => norm(c) !== norm(value))) }
  }
  if (isBaseEntry(kind, value)) {
    const hidden = parseList(settings?.[hiddenKey(kind)])
    if (hidden.some((h) => norm(h) === norm(value))) return {}
    return { [hiddenKey(kind)]: JSON.stringify([...hidden, value]) }
  }
  return {}
}

/** Restaura la lista base (quita ocultas; conserva las personalizadas). */
export function restoreBase(kind: CatalogKind): Partial<ClinicSettings> {
  return { [hiddenKey(kind)]: JSON.stringify([]) }
}

/** Número de entradas base ocultadas (para avisar en la UI). */
export function hiddenCount(kind: CatalogKind, settings?: ClinicSettings | null): number {
  return parseList(settings?.[hiddenKey(kind)]).length
}
