import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { patientService } from '@/services/patientService'
import { consultationService } from '@/services/consultationService'
import type { Patient } from '@/types/domain'

export function useSearchPatients(query: string) {
  return useQuery({
    queryKey: ['patients', 'search', query],
    queryFn: () => patientService.search(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  })
}

export function usePatientList(page = 1) {
  return useQuery({
    queryKey: ['patients', 'list', page],
    queryFn: () => patientService.list(page),
  })
}

export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.get(patientId!),
    enabled: Boolean(patientId),
  })
}

export function usePatientHistory(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId, 'history'],
    queryFn: () => consultationService.history(patientId!),
    enabled: Boolean(patientId),
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Patient>) => patientService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      expectedUpdatedAt,
    }: {
      payload: Partial<Patient> & { patient_id: string }
      expectedUpdatedAt?: string
    }) => patientService.update(payload, expectedUpdatedAt),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id] })
    },
  })
}
