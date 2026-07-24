import type { Study } from '@/types/domain'
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

const COL = 'studies'

/** Estudios complementarios (laboratorio, imagenología, etc.). */
export const studyService = {
  create: async (payload: Partial<Study>): Promise<Study> => {
    const now = nowIso()
    const record = stripUndefined({
      ...payload,
      study_id: uuid(),
      study_date: payload.study_date || now,
      created_at: now,
      updated_at: now,
      status: 'active',
    }) as Study
    return fsCreate(COL, record.study_id, record)
  },

  update: (
    payload: Partial<Study> & { study_id: string },
    expectedUpdatedAt?: string,
  ): Promise<Study> => {
    const { study_id, ...rest } = payload
    return fsUpdate<Study>(
      COL,
      study_id,
      stripUndefined({ ...rest, updated_at: nowIso() }),
      expectedUpdatedAt,
    )
  },

  get: async (study_id: string): Promise<Study> => {
    const s = await fsGet<Study>(COL, study_id)
    if (!s || s.status === 'deleted') throw new Error('Estudio no encontrado.')
    return s
  },

  history: async (patient_id: string): Promise<Paginated<Study>> => {
    const rows = (await fsListActive<Study>(COL))
      .filter((s) => String(s.patient_id) === String(patient_id))
      .sort((a, b) => String(b.study_date).localeCompare(String(a.study_date)))
    return { results: rows, total: rows.length }
  },

  listRecent: async (limit = 25): Promise<Paginated<Study>> => {
    const rows = (await fsListActive<Study>(COL)).sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    )
    return { results: rows.slice(0, limit), total: rows.length }
  },

  softDelete: async (study_id: string): Promise<{ study_id: string; status: string }> => {
    await fsSoftDelete(COL, study_id)
    return { study_id, status: 'deleted' }
  },
}
