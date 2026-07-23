import Dexie, { type Table } from 'dexie'

/**
 * IndexedDB (Dexie) como CACHÉ, borradores y COLA de sincronización.
 * NO es la fuente de verdad (esa es Google Sheets). Ver docs/01-arquitectura.md.
 */

export interface Draft {
  /** Clave estable del borrador, p.ej. `consultation:new:<patientId>`. */
  id: string
  kind: 'consultation' | 'patient'
  data: unknown
  updatedAt: number
}

export type SyncStatus = 'pending' | 'error' | 'synced'

export interface SyncItem {
  id: string // clientRequestId (idempotencia)
  action: string
  payload: unknown
  expectedUpdatedAt?: string
  status: SyncStatus
  attempts: number
  lastError?: string
  createdAt: number
  label: string // descripción legible para la pantalla de pendientes
}

class VetNoteDB extends Dexie {
  drafts!: Table<Draft, string>
  syncQueue!: Table<SyncItem, string>

  constructor() {
    super('vetnote')
    this.version(1).stores({
      drafts: 'id, kind, updatedAt',
      syncQueue: 'id, status, createdAt',
    })
  }
}

export const db = new VetNoteDB()
