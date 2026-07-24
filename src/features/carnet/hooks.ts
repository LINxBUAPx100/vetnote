import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { carnetService } from '@/services/carnetService'
import type { CarnetEntry } from '@/types/domain'

export function useCarnetEntry(id: string | undefined) {
  return useQuery({
    queryKey: ['carnet-entry', id],
    queryFn: () => carnetService.get(id!),
    enabled: Boolean(id),
  })
}

export function usePatientCarnet(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId, 'carnet'],
    queryFn: () => carnetService.byPatient(patientId!),
    enabled: Boolean(patientId),
  })
}

export function useUpcomingCarnet() {
  return useQuery({ queryKey: ['carnet', 'upcoming'], queryFn: () => carnetService.upcoming() })
}

export function useCreateCarnetEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<CarnetEntry>) => carnetService.create(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id, 'carnet'] })
      qc.invalidateQueries({ queryKey: ['carnet', 'upcoming'] })
    },
  })
}

export function useUpdateCarnetEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      expectedUpdatedAt,
    }: {
      payload: Partial<CarnetEntry> & { entry_id: string }
      expectedUpdatedAt?: string
    }) => carnetService.update(payload, expectedUpdatedAt),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['carnet-entry', data.entry_id] })
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id, 'carnet'] })
      qc.invalidateQueries({ queryKey: ['carnet', 'upcoming'] })
    },
  })
}
