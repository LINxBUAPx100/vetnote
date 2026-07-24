import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { injectionService } from '@/services/injectionService'
import type { Injection } from '@/types/domain'

export function useInjection(id: string | undefined) {
  return useQuery({
    queryKey: ['injection', id],
    queryFn: () => injectionService.get(id!),
    enabled: Boolean(id),
  })
}

export function useInjectionHistory(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId, 'injections'],
    queryFn: () => injectionService.history(patientId!),
    enabled: Boolean(patientId),
  })
}

export function useCreateInjection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Injection>) => injectionService.create(payload),
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id, 'injections'] }),
  })
}

export function useUpdateInjection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      expectedUpdatedAt,
    }: {
      payload: Partial<Injection> & { injection_id: string }
      expectedUpdatedAt?: string
    }) => injectionService.update(payload, expectedUpdatedAt),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['injection', data.injection_id] })
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id, 'injections'] })
    },
  })
}
