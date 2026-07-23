import type { Consultation } from '@/types/domain'
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

const COL = 'consultations'

export const consultationService = {
  create: async (payload: Partial<Consultation>): Promise<Consultation> => {
    const now = nowIso()
    const record = stripUndefined({
      consultation_type: 'consulta',
      ...payload,
      consultation_id: uuid(),
      consultation_date: payload.consultation_date || now,
      created_at: now,
      updated_at: now,
      status: 'active',
    }) as Consultation
    return fsCreate(COL, record.consultation_id, record)
  },

  update: (
    payload: Partial<Consultation> & { consultation_id: string },
    expectedUpdatedAt?: string,
  ): Promise<Consultation> => {
    const { consultation_id, ...rest } = payload
    const changes = stripUndefined({ ...rest, updated_at: nowIso() })
    return fsUpdate<Consultation>(COL, consultation_id, changes, expectedUpdatedAt)
  },

  get: async (consultation_id: string): Promise<Consultation> => {
    const c = await fsGet<Consultation>(COL, consultation_id)
    if (!c || c.status === 'deleted') throw new Error('Consulta no encontrada.')
    return c
  },

  history: async (patient_id: string): Promise<Paginated<Consultation>> => {
    const rows = (await fsListActive<Consultation>(COL))
      .filter((c) => String(c.patient_id) === String(patient_id))
      .sort((a, b) => String(b.consultation_date).localeCompare(String(a.consultation_date)))
    return { results: rows, total: rows.length }
  },

  listRecent: async (limit = 10): Promise<Paginated<Consultation>> => {
    const rows = (await fsListActive<Consultation>(COL)).sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    )
    return { results: rows.slice(0, limit), total: rows.length }
  },

  softDelete: async (
    consultation_id: string,
  ): Promise<{ consultation_id: string; status: string }> => {
    await fsSoftDelete(COL, consultation_id)
    return { consultation_id, status: 'deleted' }
  },
}
