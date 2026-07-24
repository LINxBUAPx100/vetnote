import type { Appointment } from '@/types/domain'
import type { Paginated } from './patientService'
import {
  fsGet,
  fsListActive,
  fsCreate,
  fsUpdate,
  fsSoftDelete,
  stripUndefined,
  uuid,
  nowIso,
} from './firestore'

const COL = 'appointments'

/** Citas de la agenda. */
export const appointmentService = {
  create: async (payload: Partial<Appointment>): Promise<Appointment> => {
    const now = nowIso()
    const record = stripUndefined({
      state: 'scheduled',
      ...payload,
      appointment_id: uuid(),
      scheduled_at: payload.scheduled_at || now,
      created_at: now,
      updated_at: now,
      status: 'active',
    }) as Appointment
    return fsCreate(COL, record.appointment_id, record)
  },

  update: (
    payload: Partial<Appointment> & { appointment_id: string },
    expectedUpdatedAt?: string,
  ): Promise<Appointment> => {
    const { appointment_id, ...rest } = payload
    return fsUpdate<Appointment>(
      COL,
      appointment_id,
      stripUndefined({ ...rest, updated_at: nowIso() }),
      expectedUpdatedAt,
    )
  },

  get: async (appointment_id: string): Promise<Appointment> => {
    const a = await fsGet<Appointment>(COL, appointment_id)
    if (!a || a.status === 'deleted') throw new Error('Cita no encontrada.')
    return a
  },

  /** Todas las citas activas ordenadas por fecha ascendente. */
  list: async (): Promise<Paginated<Appointment>> => {
    const rows = (await fsListActive<Appointment>(COL)).sort((a, b) =>
      String(a.scheduled_at).localeCompare(String(b.scheduled_at)),
    )
    return { results: rows, total: rows.length }
  },

  byPatient: async (patient_id: string): Promise<Paginated<Appointment>> => {
    const rows = (await fsListActive<Appointment>(COL))
      .filter((a) => String(a.patient_id) === String(patient_id))
      .sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)))
    return { results: rows, total: rows.length }
  },

  softDelete: async (
    appointment_id: string,
  ): Promise<{ appointment_id: string; status: string }> => {
    await fsSoftDelete(COL, appointment_id)
    return { appointment_id, status: 'deleted' }
  },
}
