import { type ReactNode } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { queryClient } from './queryClient'

/**
 * Caché persistente (stale-while-revalidate).
 *
 * Guarda el estado de React Query en localStorage, así al recargar o volver a
 * una pantalla se ve al INSTANTE lo último conocido (sin esqueletos) mientras
 * se revalida en segundo plano contra Apps Script (que es lento). El `buster`
 * invalida toda la caché si cambia (súbelo si cambia el esquema de datos).
 */
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'vetnote-rq-cache',
  throttleTime: 1000,
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 h
        buster: 'v1',
        dehydrateOptions: {
          // Solo persistir consultas exitosas (no errores ni cargas a medias).
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
