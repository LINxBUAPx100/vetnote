/**
 * Tratamiento estructurado: lista de medicamentos con posología detallada.
 *
 * La consulta guarda `treatment_items` (JSON de TreatmentItem[]) y, además, un
 * volcado legible en el campo de texto `treatment` para que la nota y la imagen
 * sigan siendo autocontenidas aunque cambie el catálogo. Ningún campo es
 * obligatorio salvo el nombre del medicamento.
 */
import type { TreatmentItem } from '@/types/domain'

export type { TreatmentItem }

/** Parsea el JSON de ítems de tratamiento de forma tolerante. */
export function parseTreatmentItems(json?: string | null): TreatmentItem[] {
  if (!json) return []
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x) => x && typeof x.name === 'string' && x.name.trim())
      .map((x) => ({
        name: String(x.name).trim(),
        medication_id: typeof x.medication_id === 'string' ? x.medication_id : undefined,
        dose: str(x.dose),
        route: str(x.route),
        frequency: str(x.frequency),
        duration: str(x.duration),
        notes: str(x.notes),
      }))
  } catch {
    return []
  }
}

function str(v: unknown): string | undefined {
  const s = v === null || v === undefined ? '' : String(v).trim()
  return s || undefined
}

/** Descripción legible de un ítem (una línea). */
export function formatTreatmentItem(item: TreatmentItem): string {
  const posology = [item.dose, item.route, item.frequency, item.duration]
    .filter(Boolean)
    .join(' · ')
  const base = posology ? `${item.name} — ${posology}` : item.name
  return item.notes ? `${base} (${item.notes})` : base
}

/** Vuelca la lista de ítems a texto multilínea (para el campo `treatment`). */
export function treatmentItemsToText(items: TreatmentItem[]): string {
  return items.map((i) => `• ${formatTreatmentItem(i)}`).join('\n')
}

export function emptyTreatmentItem(): TreatmentItem {
  return { name: '' }
}
