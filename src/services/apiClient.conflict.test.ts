import { describe, it, expect, vi, afterEach } from 'vitest'

// Simula un backend configurado para poder ejercitar la ruta de red.
vi.mock('@/config/env', () => ({
  env: {
    apiUrl: 'https://example.test/exec',
    appToken: 'tok',
    basePath: '/',
    isConfigured: true,
  },
}))

import { apiCall } from './apiClient'
import { ApiClientError } from '@/types/api'

describe('apiClient — manejo de respuestas del servidor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('mapea CONFLICT e incluye el registro del servidor', async () => {
    const serverRecord = { patient_id: 'p1', updated_at: '2026-07-23T00:00:00.000Z' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          message: 'El registro fue modificado desde otro dispositivo.',
          errorCode: 'CONFLICT',
          requestId: 'r1',
          serverRecord,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(apiCall('updatePatient', { patient_id: 'p1' })).rejects.toMatchObject({
      code: 'CONFLICT',
      serverRecord,
    })
  })

  it('devuelve data en una respuesta exitosa', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: true, data: { ok: 1 }, message: 'ok', requestId: 'r2' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    await expect(apiCall('healthCheck')).resolves.toEqual({ ok: 1 })
  })

  it('lanza BAD_RESPONSE si el cuerpo no es JSON', async () => {
    // Devuelve una Response nueva por llamada (el cuerpo solo se lee una vez).
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('no-json', { status: 200 }))
    await expect(apiCall('healthCheck')).rejects.toMatchObject({ code: 'BAD_RESPONSE' })
    await expect(apiCall('healthCheck')).rejects.toBeInstanceOf(ApiClientError)
  })
})
