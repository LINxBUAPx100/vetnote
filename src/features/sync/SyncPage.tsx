import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/States'
import { db } from '@/database/localDb'
import { processQueue } from '@/services/syncService'
import { toast } from '@/stores/uiStore'

/** Panel de sincronización, embebido en Configuración. */
export function SyncPanel() {
  const [syncing, setSyncing] = useState(false)
  const items = useLiveQuery(() => db.syncQueue.orderBy('createdAt').toArray(), [], [])
  const pending = items.filter((i) => i.status !== 'synced')

  const run = async () => {
    setSyncing(true)
    try {
      const { synced, failed } = await processQueue()
      if (synced) toast.success(`${synced} registro(s) sincronizado(s)`)
      if (!synced && failed) toast.error('No se pudo sincronizar. Revisa tu conexión.')
      if (!synced && !failed) toast.info('No hay nada pendiente')
    } finally {
      setSyncing(false)
    }
  }

  const remove = async (id: string) => {
    await db.syncQueue.delete(id)
    toast.info('Registro pendiente descartado')
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Sincronización</h2>
        </div>
        <Button onClick={run} loading={syncing} variant="ghost" className="px-3">
          <RefreshCw className="h-4 w-4" /> Sincronizar
        </Button>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Todo sincronizado"
          description="No hay registros pendientes de enviar a Google Sheets."
        />
      ) : (
        <>
          <p className="text-sm text-content-muted">
            {pending.length} registro(s) esperando conexión. Tus datos están a salvo en este
            dispositivo.
          </p>
          <ul className="space-y-2">
            {pending.map((item) => (
              <li key={item.id} className="card flex items-start gap-3 p-3">
                <StatusIcon status={item.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.label}</p>
                  <p className="text-xs text-content-muted">
                    {item.action} · {item.attempts} intento(s)
                    {item.lastError ? ` · ${item.lastError}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-content-muted hover:text-error"
                  aria-label="Descartar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'error') return <AlertTriangle className="mt-0.5 h-5 w-5 text-error" />
  return <Clock className="mt-0.5 h-5 w-5 text-warning" />
}
