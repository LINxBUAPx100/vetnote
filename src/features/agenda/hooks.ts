import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentService } from '@/services/appointmentService'
import type { Appointment } from '@/types/domain'

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentService.get(id!),
    enabled: Boolean(id),
  })
}

export function useAppointments() {
  return useQuery({ queryKey: ['appointments'], queryFn: () => appointmentService.list() })
}

export function usePatientAppointments(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId, 'appointments'],
    queryFn: () => appointmentService.byPatient(patientId!),
    enabled: Boolean(patientId),
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>, patientId?: string) {
  qc.invalidateQueries({ queryKey: ['appointments'] })
  if (patientId) qc.invalidateQueries({ queryKey: ['patient', patientId, 'appointments'] })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Appointment>) => appointmentService.create(payload),
    onSuccess: (data) => invalidate(qc, data.patient_id),
  })
}

export function useUpdateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      expectedUpdatedAt,
    }: {
      payload: Partial<Appointment> & { appointment_id: string }
      expectedUpdatedAt?: string
    }) => appointmentService.update(payload, expectedUpdatedAt),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['appointment', data.appointment_id] })
      invalidate(qc, data.patient_id)
    },
  })
}

export function useDeleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appointmentService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
