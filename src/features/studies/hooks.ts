import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { studyService } from '@/services/studyService'
import type { Study } from '@/types/domain'

export function useStudy(id: string | undefined) {
  return useQuery({
    queryKey: ['study', id],
    queryFn: () => studyService.get(id!),
    enabled: Boolean(id),
  })
}

export function useStudyHistory(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId, 'studies'],
    queryFn: () => studyService.history(patientId!),
    enabled: Boolean(patientId),
  })
}

export function useCreateStudy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Study>) => studyService.create(payload),
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id, 'studies'] }),
  })
}

export function useUpdateStudy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      expectedUpdatedAt,
    }: {
      payload: Partial<Study> & { study_id: string }
      expectedUpdatedAt?: string
    }) => studyService.update(payload, expectedUpdatedAt),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['study', data.study_id] })
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id, 'studies'] })
    },
  })
}
