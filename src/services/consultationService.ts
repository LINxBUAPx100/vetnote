import { apiCall } from './apiClient'
import type { Consultation } from '@/types/domain'
import type { Paginated } from './patientService'

export const consultationService = {
  create: (payload: Partial<Consultation>) =>
    apiCall<Consultation>('createConsultation', payload),
  update: (
    payload: Partial<Consultation> & { consultation_id: string },
    expectedUpdatedAt?: string,
  ) => apiCall<Consultation>('updateConsultation', payload, { expectedUpdatedAt }),
  get: (consultation_id: string) => apiCall<Consultation>('getConsultation', { consultation_id }),
  history: (patient_id: string) =>
    apiCall<Paginated<Consultation>>('getPatientHistory', { patient_id }),
  listRecent: (limit = 10) =>
    apiCall<Paginated<Consultation>>('listRecentConsultations', { limit }),
  softDelete: (consultation_id: string) =>
    apiCall<{ consultation_id: string; status: string }>('softDeleteConsultation', {
      consultation_id,
    }),
}
