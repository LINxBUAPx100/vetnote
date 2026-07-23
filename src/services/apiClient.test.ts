import { describe, it, expect, vi } from 'vitest'

// Fuerza el estado "sin backend configurado" con independencia del .env real,
// para verificar el guardia NOT_CONFIGURED del cliente.
vi.mock('@/config/env', () => ({
  env: { apiUrl: '', appToken: '', basePath: '/', isConfigured: false },
}))

import { apiCall } from './apiClient'
import { ApiClientError } from '@/types/api'

describe('apiClient', () => {
  it('lanza NOT_CONFIGURED cuando no hay URL de backend', async () => {
    await expect(apiCall('healthCheck')).rejects.toMatchObject({ code: 'NOT_CONFIGURED' })
    await expect(apiCall('healthCheck')).rejects.toBeInstanceOf(ApiClientError)
  })
})
