import type { Injection } from '@/types/domain'
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

const COL = 'injections'

/** Registro de inyecciones / aplicaciones parenterales. */
export const injectionService = {
  create: async (payload: Partial<Injection>): Promise<Injection> => {
    const now = nowIso()
    const record = stripUndefined({
      ...payload,
      injection_id: uuid(),
      injection_date: payload.injection_date || now,
      created_at: now,
      updated_at: now,
      status: 'active',
    }) as Injection
    return fsCreate(COL, record.injection_id, record)
  },

  update: (
    payload: Partial<Injection> & { injection_id: string },
    expectedUpdatedAt?: string,
  ): Promise<Injection> => {
    const { injection_id, ...rest } = payload
    return fsUpdate<Injection>(
      COL,
      injection_id,
      stripUndefined({ ...rest, updated_at: nowIso() }),
      expectedUpdatedAt,
    )
  },

  get: async (injection_id: string): Promise<Injection> => {
    const i = await fsGet<Injection>(COL, injection_id)
    if (!i || i.status === 'deleted') throw new Error('Inyección no encontrada.')
    return i
  },

  history: async (patient_id: string): Promise<Paginated<Injection>> => {
    const rows = (await fsListActive<Injection>(COL))
      .filter((i) => String(i.patient_id) === String(patient_id))
      .sort((a, b) => String(b.injection_date).localeCompare(String(a.injection_date)))
    return { results: rows, total: rows.length }
  },

  listRecent: async (limit = 25): Promise<Paginated<Injection>> => {
    const rows = (await fsListActive<Injection>(COL)).sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    )
    return { results: rows.slice(0, limit), total: rows.length }
  },

  softDelete: async (injection_id: string): Promise<{ injection_id: string; status: string }> => {
    await fsSoftDelete(COL, injection_id)
    return { injection_id, status: 'deleted' }
  },
}
