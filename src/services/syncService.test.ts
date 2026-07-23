import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClientError } from '@/types/api'

// Mock del apiClient para controlar el resultado de cada llamada.
vi.mock('./apiClient', () => ({ apiCall: vi.fn() }))
import { apiCall } from './apiClient'
import { writeWithQueue, processQueue, pendingCount } from './syncService'
import { db } from '@/database/localDb'

const mockedApiCall = vi.mocked(apiCall)

describe('syncService', () => {
  beforeEach(async () => {
    await db.syncQueue.clear()
    mockedApiCall.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it('devuelve datos y NO encola cuando la llamada tiene éxito', async () => {
    mockedApiCall.mockResolvedValueOnce({ consultation_id: 'c1' })
    const result = await writeWithQueue({
      action: 'createConsultation',
      payload: { patient_id: 'p1' },
      label: 'Consulta',
    })
    expect(result).toEqual({ consultation_id: 'c1' })
    expect(await pendingCount()).toBe(0)
  })

  it('encola ante error de RED y relanza el error', async () => {
    mockedApiCall.mockRejectedValueOnce(new ApiClientError('sin red', 'NETWORK_ERROR'))
    await expect(
      writeWithQueue({ action: 'createConsultation', payload: { patient_id: 'p1' }, label: 'Consulta' }),
    ).rejects.toBeInstanceOf(ApiClientError)
    expect(await pendingCount()).toBe(1)
  })

  it('NO encola ante error de negocio (validación)', async () => {
    mockedApiCall.mockRejectedValueOnce(new ApiClientError('inválido', 'VALIDATION_ERROR'))
    await expect(
      writeWithQueue({ action: 'createConsultation', payload: {}, label: 'Consulta' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(await pendingCount()).toBe(0)
  })

  it('processQueue reenvía pendientes y los elimina al sincronizar', async () => {
    // Encola un pendiente por error de red.
    mockedApiCall.mockRejectedValueOnce(new ApiClientError('sin red', 'NETWORK_ERROR'))
    await writeWithQueue({ action: 'createOwner', payload: { full_name: 'X' }, label: 'Tutor' }).catch(() => {})
    expect(await pendingCount()).toBe(1)

    // Ahora la red responde bien: se procesa y se vacía la cola.
    mockedApiCall.mockResolvedValueOnce({ owner_id: 'o1' })
    const { synced } = await processQueue()
    expect(synced).toBe(1)
    expect(await pendingCount()).toBe(0)
  })

  it('reutiliza el mismo clientRequestId al reintentar (idempotencia)', async () => {
    mockedApiCall.mockRejectedValueOnce(new ApiClientError('sin red', 'NETWORK_ERROR'))
    await writeWithQueue({ action: 'createOwner', payload: { full_name: 'X' }, label: 'Tutor' }).catch(() => {})
    const queued = await db.syncQueue.toArray()
    const id = queued[0]!.id

    mockedApiCall.mockResolvedValueOnce({ owner_id: 'o1' })
    await processQueue()
    // El clientRequestId enviado en el reintento coincide con el id de la cola.
    const calls = mockedApiCall.mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall?.[2]).toMatchObject({ clientRequestId: id })
  })
})
