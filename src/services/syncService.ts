import { apiCall } from './apiClient'
import { db, type SyncItem } from '@/database/localDb'
import { ApiClientError, type ApiAction } from '@/types/api'

/**
 * Cola de sincronización. Ante error de RED, la operación se guarda en
 * IndexedDB y se reintenta luego. Ante error de NEGOCIO (validación, conflicto)
 * NO se encola: se propaga para que la UI lo muestre.
 */

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `q-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

interface EnqueueInput {
  action: ApiAction
  payload: unknown
  label: string
  expectedUpdatedAt?: string
}

/**
 * Ejecuta una escritura con soporte offline.
 * - Éxito → devuelve los datos.
 * - Error de red → encola y lanza un ApiClientError 'NETWORK_ERROR' (la UI decide).
 * - Error de negocio → lanza sin encolar.
 */
export async function writeWithQueue<D>(input: EnqueueInput): Promise<D> {
  const id = newId()
  try {
    return await apiCall<D>(input.action, input.payload, {
      clientRequestId: id,
      expectedUpdatedAt: input.expectedUpdatedAt,
    })
  } catch (err) {
    if (err instanceof ApiClientError && err.code === 'NETWORK_ERROR') {
      await db.syncQueue.put({
        id,
        action: input.action,
        payload: input.payload,
        expectedUpdatedAt: input.expectedUpdatedAt,
        status: 'pending',
        attempts: 0,
        createdAt: Date.now(),
        label: input.label,
      })
    }
    throw err
  }
}

/** Procesa la cola completa. Devuelve cuántos se sincronizaron. */
export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const items = await db.syncQueue.where('status').notEqual('synced').toArray()
  let synced = 0
  let failed = 0
  for (const item of items) {
    try {
      await apiCall(item.action as ApiAction, item.payload, {
        clientRequestId: item.id,
        expectedUpdatedAt: item.expectedUpdatedAt,
      })
      await db.syncQueue.delete(item.id)
      synced++
    } catch (err) {
      const isNetwork = err instanceof ApiClientError && err.code === 'NETWORK_ERROR'
      await db.syncQueue.update(item.id, {
        status: isNetwork ? 'pending' : 'error',
        attempts: item.attempts + 1,
        lastError: (err as Error).message,
      } satisfies Partial<SyncItem>)
      failed++
      // Si es error de red, no seguimos intentando el resto (probablemente offline).
      if (isNetwork) break
    }
  }
  return { synced, failed }
}

export async function pendingCount(): Promise<number> {
  return db.syncQueue.where('status').notEqual('synced').count()
}
