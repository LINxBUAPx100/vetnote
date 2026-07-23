import type { Owner, Patient } from '@/types/domain'
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

const COL = 'owners'
const PATIENTS = 'patients'

export const ownerService = {
  create: async (payload: Partial<Owner>): Promise<Owner> => {
    const now = nowIso()
    const record = stripUndefined({
      ...payload,
      owner_id: uuid(),
      created_at: now,
      updated_at: now,
      status: 'active',
    }) as Owner
    return fsCreate(COL, record.owner_id, record)
  },

  update: (
    payload: Partial<Owner> & { owner_id: string },
    expectedUpdatedAt?: string,
  ): Promise<Owner> => {
    const { owner_id, ...rest } = payload
    const changes = stripUndefined({ ...rest, updated_at: nowIso() })
    return fsUpdate<Owner>(COL, owner_id, changes, expectedUpdatedAt)
  },

  get: async (owner_id: string): Promise<Owner> => {
    const owner = await fsGet<Owner>(COL, owner_id)
    if (!owner || owner.status === 'deleted') throw new Error('Tutor no encontrado.')
    return owner
  },

  search: async (query: string, limit = 15): Promise<Paginated<Owner>> => {
    const q = query.trim().toLowerCase()
    if (!q) return { results: [], total: 0 }
    const matches = (await fsListActive<Owner>(COL)).filter((o) =>
      [o.full_name, o.phone, o.secondary_phone, o.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
    return { results: matches.slice(0, limit), total: matches.length }
  },

  list: async (page = 1, pageSize = 50): Promise<Paginated<Owner>> => {
    const all = (await fsListActive<Owner>(COL)).sort((a, b) =>
      String(a.full_name).localeCompare(String(b.full_name)),
    )
    const start = (page - 1) * pageSize
    return { results: all.slice(start, start + pageSize), total: all.length, page, pageSize }
  },

  softDelete: async (owner_id: string): Promise<{ owner_id: string; status: string }> => {
    // No dejar pacientes huérfanos: rechaza si el tutor tiene mascotas activas.
    const pets = (await fsListActive<Patient>(PATIENTS)).filter(
      (p) => String(p.owner_id) === String(owner_id),
    )
    if (pets.length > 0) {
      throw new Error(
        `Este tutor tiene ${pets.length} mascota(s) registrada(s). ` +
          'Elimina o reasigna sus mascotas antes de eliminar al tutor.',
      )
    }
    await fsSoftDelete(COL, owner_id)
    return { owner_id, status: 'deleted' }
  },
}
