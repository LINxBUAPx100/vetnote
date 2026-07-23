import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { firestore } from '@/config/firebase'
import { ApiClientError } from '@/types/api'

/**
 * Capa única de acceso a Firestore (equivale al viejo SheetRepository).
 * Mantiene la misma semántica del backend anterior: IDs UUID, baja lógica por
 * `status='deleted'`, y concurrencia optimista con `updated_at → CONFLICT`.
 */

export function nowIso(): string {
  return new Date().toISOString()
}

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

export type WithStatus = { status?: string; updated_at?: string }

/**
 * Firestore rechaza valores `undefined`. Devuelve una copia sin esas claves.
 * (Los campos opcionales vacíos simplemente no se guardan.)
 */
export function stripUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

/** Lee un documento por id. Devuelve null si no existe. */
export async function fsGet<T>(col: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(firestore, col, id))
  return snap.exists() ? (snap.data() as T) : null
}

/** Lee todos los documentos de una colección. */
export async function fsListAll<T>(col: string): Promise<T[]> {
  const snap = await getDocs(collection(firestore, col))
  return snap.docs.map((d) => d.data() as T)
}

/** Lee todos los documentos NO eliminados (status !== 'deleted'). */
export async function fsListActive<T extends WithStatus>(col: string): Promise<T[]> {
  const all = await fsListAll<T>(col)
  return all.filter((r) => r.status !== 'deleted')
}

/** Inserta un documento nuevo usando `id` como identificador del documento. */
export async function fsCreate<T extends object>(
  col: string,
  id: string,
  record: T,
): Promise<T> {
  await setDoc(doc(firestore, col, id), record as Record<string, unknown>)
  return record
}

/**
 * Actualiza un documento con control de concurrencia optimista. Si se pasa
 * `expectedUpdatedAt` y el documento cambió desde entonces, lanza CONFLICT con
 * la versión del servidor (igual que el backend anterior).
 */
export async function fsUpdate<T extends WithStatus>(
  col: string,
  id: string,
  changes: Record<string, unknown>,
  expectedUpdatedAt?: string,
): Promise<T> {
  const ref = doc(firestore, col, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new ApiClientError('El registro no existe.', 'NOT_FOUND')
  const current = snap.data() as T

  if (expectedUpdatedAt && String(current.updated_at ?? '') !== String(expectedUpdatedAt)) {
    throw new ApiClientError(
      'El registro fue modificado desde otro dispositivo.',
      'CONFLICT',
      undefined,
      current,
    )
  }

  await updateDoc(ref, changes)
  return { ...current, ...changes } as T
}

/** Baja lógica: marca `status='deleted'`. */
export async function fsSoftDelete(col: string, id: string): Promise<void> {
  await updateDoc(doc(firestore, col, id), { status: 'deleted', updated_at: nowIso() })
}
