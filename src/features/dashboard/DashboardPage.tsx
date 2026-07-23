import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus,
  Search,
  CheckCircle2,
  Stethoscope,
  RefreshCw,
  Calendar,
  PawPrint,
  Users,
} from 'lucide-react'
import { env } from '@/config/env'
import { Input } from '@/components/ui/Field'
import { useDebounced } from '@/hooks/useDebounced'
import { useSearchPatients } from '@/features/patients/hooks'
import { useRecentConsultations } from '@/features/consultations/hooks'
import { consultationService } from '@/services/consultationService'
import { patientService } from '@/services/patientService'
import { ownerService } from '@/services/ownerService'
import { db } from '@/database/localDb'
import { formatDate } from '@/utils/format'

function useStats() {
  const consultations = useQuery({
    queryKey: ['stats', 'consultations'],
    queryFn: () => consultationService.listRecent(1),
    staleTime: 60_000,
  })
  const patients = useQuery({
    queryKey: ['stats', 'patients'],
    queryFn: () => patientService.list(1, 1),
    staleTime: 60_000,
  })
  const owners = useQuery({
    queryKey: ['stats', 'owners'],
    queryFn: () => ownerService.list(1, 1),
    staleTime: 60_000,
  })
  return {
    consultations: consultations.data?.total,
    patients: patients.data?.total,
    owners: owners.data?.total,
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const search = useSearchPatients(debounced)
  const stats = useStats()
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

      {env.isConfigured && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard to="/consultations" icon={Stethoscope} value={stats.consultations} label="Consultas" />
          <StatCard to="/patients" icon={PawPrint} value={stats.patients} label="Pacientes" />
          <StatCard to="/owners" icon={Users} value={stats.owners} label="Tutores" />
        </div>
      )}

      {pending > 0 && (
        <Link to="/settings" className="card flex items-center gap-3 p-3">
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

      <ConnectionCard />
    </div>
  )
}

function StatCard({
  to,
  icon: Icon,
  value,
  label,
}: {
  to: string
  icon: typeof Stethoscope
  value: number | undefined
  label: string
}) {
  return (
    <Link to={to} className="card flex flex-col items-center gap-1 p-3 hover:bg-background">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xl font-bold leading-none">{value ?? '—'}</span>
      <span className="text-xs text-content-muted">{label}</span>
    </Link>
  )
}

function ConnectionCard() {
  return (
    <div className="card flex items-center gap-3 p-4">
      <CheckCircle2 className="h-5 w-5 text-success" />
      <p className="text-sm">Datos guardados en la nube (Firebase)</p>
    </div>
  )
}
