import type { CarnetEntry } from '@/types/domain'
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

const COL = 'carnet_entries'

/** Entradas del carnet sanitario (vacunas, desparasitaciones, etc.). */
export const carnetService = {
  create: async (payload: Partial<CarnetEntry>): Promise<CarnetEntry> => {
    const now = nowIso()
    const record = stripUndefined({
      category: 'vacuna',
      ...payload,
      entry_id: uuid(),
      application_date: payload.application_date || now,
      created_at: now,
      updated_at: now,
      status: 'active',
    }) as CarnetEntry
    return fsCreate(COL, record.entry_id, record)
  },

  update: (
    payload: Partial<CarnetEntry> & { entry_id: string },
    expectedUpdatedAt?: string,
  ): Promise<CarnetEntry> => {
    const { entry_id, ...rest } = payload
    return fsUpdate<CarnetEntry>(
      COL,
      entry_id,
      stripUndefined({ ...rest, updated_at: nowIso() }),
      expectedUpdatedAt,
    )
  },

  get: async (entry_id: string): Promise<CarnetEntry> => {
    const e = await fsGet<CarnetEntry>(COL, entry_id)
    if (!e || e.status === 'deleted') throw new Error('Entrada de carnet no encontrada.')
    return e
  },

  byPatient: async (patient_id: string): Promise<Paginated<CarnetEntry>> => {
    const rows = (await fsListActive<CarnetEntry>(COL))
      .filter((e) => String(e.patient_id) === String(patient_id))
      .sort((a, b) => String(b.application_date).localeCompare(String(a.application_date)))
    return { results: rows, total: rows.length }
  },

  /** Próximas dosis pendientes (con next_due_date en el futuro cercano). */
  upcoming: async (limit = 50): Promise<Paginated<CarnetEntry>> => {
    const rows = (await fsListActive<CarnetEntry>(COL))
      .filter((e) => Boolean(e.next_due_date))
      .sort((a, b) => String(a.next_due_date).localeCompare(String(b.next_due_date)))
    return { results: rows.slice(0, limit), total: rows.length }
  },

  softDelete: async (entry_id: string): Promise<{ entry_id: string; status: string }> => {
    await fsSoftDelete(COL, entry_id)
    return { entry_id, status: 'deleted' }
  },
}
