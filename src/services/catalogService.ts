import { apiCall } from './apiClient'
import type { ClinicSettings, Medication, Template } from '@/types/domain'
import type { Paginated } from './patientService'

export const templateService = {
  list: () => apiCall<Paginated<Template>>('listTemplates'),
  create: (payload: Partial<Template>) => apiCall<Template>('createTemplate', payload),
  update: (payload: Partial<Template> & { template_id: string }, expectedUpdatedAt?: string) =>
    apiCall<Template>('updateTemplate', payload, { expectedUpdatedAt }),
}

export const medicationService = {
  list: () => apiCall<Paginated<Medication>>('listMedications'),
  create: (payload: Partial<Medication>) => apiCall<Medication>('createMedication', payload),
  update: (payload: Partial<Medication> & { medication_id: string }, expectedUpdatedAt?: string) =>
    apiCall<Medication>('updateMedication', payload, { expectedUpdatedAt }),
}

export const settingsService = {
  get: () => apiCall<ClinicSettings>('getSettings'),
  update: (payload: Partial<ClinicSettings>) => apiCall<ClinicSettings>('updateSettings', payload),
}
