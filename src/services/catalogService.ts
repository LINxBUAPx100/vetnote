import { doc, getDoc, setDoc } from 'firebase/firestore'
import { firestore } from '@/config/firebase'
import type { ClinicSettings, Medication, Template } from '@/types/domain'
import type { Paginated } from './patientService'
import {
  fsListActive,
  fsCreate,
  fsUpdate,
  stripUndefined,
  uuid,
  nowIso,
} from './firestore'

const TEMPLATES = 'templates'
const MEDICATIONS = 'medications'

export const templateService = {
  list: async (): Promise<Paginated<Template>> => {
    const rows = (await fsListActive<Template>(TEMPLATES)).sort((a, b) =>
      String(a.name).localeCompare(String(b.name)),
    )
    return { results: rows, total: rows.length }
  },
  create: async (payload: Partial<Template>): Promise<Template> => {
    const now = nowIso()
    const record = stripUndefined({
      ...payload,
      template_id: uuid(),
      created_at: now,
      updated_at: now,
      status: 'active',
    }) as Template
    return fsCreate(TEMPLATES, record.template_id, record)
  },
  update: (
    payload: Partial<Template> & { template_id: string },
    expectedUpdatedAt?: string,
  ): Promise<Template> => {
    const { template_id, ...rest } = payload
    return fsUpdate<Template>(
      TEMPLATES,
      template_id,
      stripUndefined({ ...rest, updated_at: nowIso() }),
      expectedUpdatedAt,
    )
  },
}

export const medicationService = {
  list: async (): Promise<Paginated<Medication>> => {
    const rows = (await fsListActive<Medication>(MEDICATIONS)).sort((a, b) =>
      String(a.generic_name).localeCompare(String(b.generic_name)),
    )
    return { results: rows, total: rows.length }
  },
  create: async (payload: Partial<Medication>): Promise<Medication> => {
    const now = nowIso()
    const record = stripUndefined({
      ...payload,
      medication_id: uuid(),
      created_at: now,
      updated_at: now,
      status: 'active',
    }) as Medication
    return fsCreate(MEDICATIONS, record.medication_id, record)
  },
  update: (
    payload: Partial<Medication> & { medication_id: string },
    expectedUpdatedAt?: string,
  ): Promise<Medication> => {
    const { medication_id, ...rest } = payload
    return fsUpdate<Medication>(
      MEDICATIONS,
      medication_id,
      stripUndefined({ ...rest, updated_at: nowIso() }),
      expectedUpdatedAt,
    )
  },
}

/** La configuración de la clínica vive en un único documento `settings/clinic`. */
const SETTINGS_DOC = doc(firestore, 'settings', 'clinic')

export const settingsService = {
  get: async (): Promise<ClinicSettings> => {
    const snap = await getDoc(SETTINGS_DOC)
    return snap.exists() ? (snap.data() as ClinicSettings) : {}
  },
  update: async (payload: Partial<ClinicSettings>): Promise<ClinicSettings> => {
    await setDoc(SETTINGS_DOC, stripUndefined({ ...payload, updated_at: nowIso() }), {
      merge: true,
    })
    const snap = await getDoc(SETTINGS_DOC)
    return snap.exists() ? (snap.data() as ClinicSettings) : {}
  },
}
