import { apiCall } from './apiClient'
import type { Owner } from '@/types/domain'
import type { Paginated } from './patientService'

export const ownerService = {
  create: (payload: Partial<Owner>) => apiCall<Owner>('createOwner', payload),
  update: (payload: Partial<Owner> & { owner_id: string }, expectedUpdatedAt?: string) =>
    apiCall<Owner>('updateOwner', payload, { expectedUpdatedAt }),
  get: (owner_id: string) => apiCall<Owner>('getOwner', { owner_id }),
  search: (query: string, limit = 15) =>
    apiCall<Paginated<Owner>>('searchOwners', { query, limit }),
  list: (page = 1, pageSize = 50) => apiCall<Paginated<Owner>>('listOwners', { page, pageSize }),
}
