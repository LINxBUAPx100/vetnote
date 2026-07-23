import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus,
  Search,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import { env } from '@/config/env'
import { ApiClientError } from '@/types/api'
import type { HealthCheckResult } from '@/types/domain'
import { Input } from '@/components/ui/Field'
import { useDebounced } from '@/hooks/useDebounced'
import { useSearchPatients } from '@/features/patients/hooks'
import { useRecentConsultations } from '@/features/consultations/hooks'
import { db } from '@/database/localDb'
import { formatDate } from '@/utils/format'

function useHealthCheck() {
  return useQuery({
    queryKey: ['healthCheck'],
    queryFn: () => apiCall<HealthCheckResult>('healthCheck'),
    enabled: env.isConfigured,
    staleTime: 30_000,
  })
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const search = useSearchPatients(debounced)
  const health = useHealthCheck()
  const recent = useRecentConsultations(5)
  const pending = useLiveQuery(
    () => db.syncQueue.where('status').notEqual('synced').count(),
    [],
    0,
  )

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-content-muted">{formatDate(new Date().toISOString())}</p>
        <h1 className="text-2xl font-bold">VetNote</h1>
      </header>

      <button
        type="button"
        onClick={() => navigate('/consultations/new')}
        className="btn-primary w-full py-4 text-base"
      >
        <Plus className="h-5 w-5" />
        Nueva consulta
      </button>

      <div>
        <label className="flex min-h-touch items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search className="h-5 w-5 text-content-muted" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paciente…"
            aria-label="Buscar paciente"
            className="border-0 bg-transparent px-0 focus:ring-0"
          />
        </label>
        {debounced.length >= 2 && search.data && (
          <ul className="mt-2 space-y-1">
            {search.data.results.slice(0, 5).map((p) => (
              <li key={p.patient_id}>
                <Link
                  to={`/patients/${p.patient_id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-surface"
                >
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span className="truncate">
                    {p.name}
                    <span className="text-content-muted"> · {p.owner_name ?? 's/tutor'}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pending > 0 && (
        <Link to="/sync" className="card flex items-center gap-3 p-3">
          <RefreshCw className="h-5 w-5 text-warning" />
          <div className="flex-1">
            <p className="font-medium">Pendientes de sincronizar</p>
            <p className="text-sm text-content-muted">{pending} registro(s)</p>
          </div>
        </Link>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-content-muted">Consultas recientes</h2>
        {recent.data && recent.data.results.length > 0 ? (
          <ul className="space-y-2">
            {recent.data.results.map((c) => (
              <li key={c.consultation_id}>
                <Link
                  to={`/consultations/${c.consultation_id}`}
                  className="card flex items-center gap-3 p-3 hover:bg-background"
                >
                  <Calendar className="h-4 w-4 text-content-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {c.presumptive_diagnosis || c.reason || 'Consulta'}
                    </p>
                    <p className="text-xs text-content-muted">{formatDate(c.consultation_date)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-content-muted">Aún no hay consultas registradas.</p>
        )}
      </section>

      <ConnectionCard health={health} />
    </div>
  )
}

function ConnectionCard({ health }: { health: ReturnType<typeof useHealthCheck> }) {
  if (!env.isConfigured) {
    return (
      <div className="card flex items-start gap-3 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
        <div>
          <p className="font-medium">Backend sin configurar</p>
          <p className="text-sm text-content-muted">
            Define <code className="rounded bg-background px-1">VITE_API_URL</code> y{' '}
            <code className="rounded bg-background px-1">VITE_APP_TOKEN</code>. Ver README.
          </p>
        </div>
      </div>
    )
  }
  if (health.isLoading) return <div className="card h-16 animate-pulse p-4" aria-hidden />
  if (health.isError) {
    const err = health.error
    const isNetwork = err instanceof ApiClientError && err.code === 'NETWORK_ERROR'
    return (
      <div className="card flex items-start gap-3 p-4">
        <WifiOff className="mt-0.5 h-5 w-5 text-error" />
        <div>
          <p className="font-medium">Sin conexión con Google Sheets</p>
          <p className="text-sm text-content-muted">
            {isNetwork
              ? 'No se pudo alcanzar el backend. Revisa la URL del Web App.'
              : (err as Error).message}
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="card flex items-center gap-3 p-4">
      <CheckCircle2 className="h-5 w-5 text-success" />
      <p className="text-sm">
        Conectado a Google Sheets · esquema v{health.data?.schemaVersion}
      </p>
    </div>
  )
}
