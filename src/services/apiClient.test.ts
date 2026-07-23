import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiCall } from './apiClient'
import { ApiClientError } from '@/types/api'

// El cliente lee la config al ejecutarse; en el entorno de test VITE_API_URL
// no está definida, por lo que debe fallar con NOT_CONFIGURED antes de tocar la red.
describe('apiClient', () => {
  afterEach(() => vi.restoreAllMocks())

  it('lanza NOT_CONFIGURED cuando no hay URL de backend', async () => {
    await expect(apiCall('healthCheck')).rejects.toMatchObject({
      code: 'NOT_CONFIGURED',
    })
    await expect(apiCall('healthCheck')).rejects.toBeInstanceOf(ApiClientError)
  })
})
