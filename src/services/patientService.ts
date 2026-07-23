import type { Owner, Patient } from '@/types/domain'
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

export interface PatientSearchResult extends Patient {
  owner_name?: string
  owner_phone?: string
}
export interface Paginated<T> {
  results: T[]
  total: number
  page?: number
  pageSize?: number
}
export type PatientWithOwner = Patient & { owner: Owner | null }

const COL = 'patients'
const OWNERS = 'owners'

async function ownersById(): Promise<Record<string, Owner>> {
  const owners = await fsListActive<Owner>(OWNERS)
  const map: Record<string, Owner> = {}
  owners.forEach((o) => (map[o.owner_id] = o))
  return map
}

export const patientService = {
  create: async (payload: Partial<Patient>): Promise<Patient> => {
    const now = nowIso()
    const record = stripUndefined({
      ...payload,
      patient_id: uuid(),
      created_at: now,
      updated_at: now,
      status: 'active',
    }) as Patient
    return fsCreate(COL, record.patient_id, record)
  },

  update: (
    payload: Partial<Patient> & { patient_id: string },
    expectedUpdatedAt?: string,
  ): Promise<Patient> => {
    const { patient_id, ...rest } = payload
    const changes = stripUndefined({ ...rest, updated_at: nowIso() })
    return fsUpdate<Patient>(COL, patient_id, changes, expectedUpdatedAt)
  },

  get: async (patient_id: string): Promise<PatientWithOwner> => {
    const patient = await fsGet<Patient>(COL, patient_id)
    if (!patient || patient.status === 'deleted') {
      throw new Error('Paciente no encontrado.')
    }
    const owner = patient.owner_id ? await fsGet<Owner>(OWNERS, patient.owner_id) : null
    return { ...patient, owner: owner && owner.status !== 'deleted' ? owner : null }
  },

  search: async (query: string, limit = 25): Promise<Paginated<PatientSearchResult>> => {
    const q = query.trim().toLowerCase()
    if (!q) return { results: [], total: 0 }
    const [patients, owners] = await Promise.all([
      fsListActive<Patient>(COL),
      ownersById(),
    ])
    const matches = patients.filter((p) => {
      const owner = owners[p.owner_id]
      const hay = [
        p.name,
        p.breed,
        p.species,
        p.patient_id,
        p.microchip,
        owner?.full_name,
        owner?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    const results = matches.slice(0, limit).map((p) => {
      const owner = owners[p.owner_id]
      return { ...p, owner_name: owner?.full_name ?? '', owner_phone: owner?.phone ?? '' }
    })
    return { results, total: matches.length }
  },

  list: async (page = 1, pageSize = 25): Promise<Paginated<Patient>> => {
    const all = (await fsListActive<Patient>(COL)).sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    )
    const start = (page - 1) * pageSize
    return {
      results: all.slice(start, start + pageSize),
      total: all.length,
      page,
      pageSize,
    }
  },

  listByOwner: async (owner_id: string): Promise<Paginated<Patient>> => {
    const all = (await fsListActive<Patient>(COL))
      .filter((p) => String(p.owner_id) === String(owner_id))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    return { results: all, total: all.length }
  },

  softDelete: async (patient_id: string): Promise<{ patient_id: string; status: string }> => {
    await fsSoftDelete(COL, patient_id)
    return { patient_id, status: 'deleted' }
  },
}
