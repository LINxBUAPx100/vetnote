import { apiCall } from './apiClient'
import type { Owner, Patient } from '@/types/domain'

export interface PatientSearchResult extends Patient {
  owner_name?: string
  owner_phone?: string
}
export interface Paginated<T> {
  results: T[]
  total: number
  page?: number
  pageSize?: number
}
export type PatientWithOwner = Patient & { owner: Owner | null }

export const patientService = {
  create: (payload: Partial<Patient>) => apiCall<Patient>('createPatient', payload),
  update: (payload: Partial<Patient> & { patient_id: string }, expectedUpdatedAt?: string) =>
    apiCall<Patient>('updatePatient', payload, { expectedUpdatedAt }),
  get: (patient_id: string) => apiCall<PatientWithOwner>('getPatient', { patient_id }),
  search: (query: string, limit = 25) =>
    apiCall<Paginated<PatientSearchResult>>('searchPatients', { query, limit }),
  list: (page = 1, pageSize = 25) =>
    apiCall<Paginated<Patient>>('listPatients', { page, pageSize }),
  softDelete: (patient_id: string) =>
    apiCall<{ patient_id: string; status: string }>('softDeletePatient', { patient_id }),
}
