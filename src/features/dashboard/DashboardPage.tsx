import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Stethoscope,
  CalendarClock,
  PawPrint,
  Users,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'
import { SearchInput } from '@/components/ui/Field'
import { SectionHeader } from '@/components/layout/PageHeader'
import { useDebounced } from '@/hooks/useDebounced'
import { useSearchPatients } from '@/features/patients/hooks'
import { useRecentConsultations } from '@/features/consultations/hooks'
import { useAppointments } from '@/features/agenda/hooks'
import { consultationService } from '@/services/consultationService'
import { patientService } from '@/services/patientService'
import { ownerService } from '@/services/ownerService'
import { formatDate, formatTime } from '@/utils/format'

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

/** Saludo según la hora: pequeño detalle que humaniza la pantalla. */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const search = useSearchPatients(debounced)
  const stats = useStats()
  const recent = useRecentConsultations(5)
  const appointments = useAppointments()

  const nowIso = new Date().toISOString()
  const upcoming = (appointments.data?.results ?? [])
    .filter((a) => a.state === 'scheduled' && a.scheduled_at >= nowIso)
    .slice(0, 3)
  const showResults = debounced.trim().length >= 2

  return (
    <div className="space-y-10">
      {/* Saludo + acción principal */}
      <header>
        <p className="eyebrow">{formatDate(nowIso)}</p>
        <h1 className="mt-1.5 text-3xl font-semibold text-content-strong">{greeting()}</h1>
        <p className="mt-2 text-sm text-content-muted">
          Registra una consulta o busca un expediente para empezar.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/consultations/new')}
            className="btn-primary sm:w-auto sm:px-5"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} /> Nueva consulta
          </button>
          <button
            type="button"
            onClick={() => navigate('/appointments/new')}
            className="btn-ghost sm:w-auto sm:px-5"
          >
            <CalendarClock className="h-4 w-4" strokeWidth={1.9} /> Agendar cita
          </button>
        </div>
      </header>

      {/* Búsqueda rápida */}
      <section>
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Buscar paciente"
          placeholder="Buscar paciente, tutor o microchip…"
        />
        {showResults && search.data && (
          <div className="mt-2 overflow-hidden rounded-card border border-line bg-surface">
            {search.data.results.length === 0 ? (
              <p className="px-3 py-3 text-sm text-content-muted">
                Sin coincidencias para “{debounced}”.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {search.data.results.slice(0, 5).map((p) => (
                  <li key={p.patient_id}>
                    <Link to={`/patients/${p.patient_id}`} className="row">
                      <PawPrint className="h-4 w-4 shrink-0 text-content-subtle" strokeWidth={1.9} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-content-strong">
                        {p.name}
                        <span className="ml-1.5 font-normal text-content-subtle">
                          {p.owner_name ?? 'Sin tutor'}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-content-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Métricas: números grandes, etiquetas discretas, sin cajas pesadas */}
      <section className="grid grid-cols-3 divide-x divide-line rounded-card border border-line bg-surface">
        <Stat to="/consultations" icon={Stethoscope} value={stats.consultations} label="Consultas" />
        <Stat to="/patients" icon={PawPrint} value={stats.patients} label="Pacientes" />
        <Stat to="/owners" icon={Users} value={stats.owners} label="Tutores" />
      </section>

      {/* Próximas citas */}
      {upcoming.length > 0 && (
        <section>
          <SectionHeader
            title="Próximas citas"
            action={
              <Link
                to="/agenda"
                className="text-xs font-semibold text-primary transition-colors duration-200 hover:text-primary-600"
              >
                Ver agenda
              </Link>
            }
          />
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {upcoming.map((a) => (
              <li key={a.appointment_id}>
                <Link to={`/appointments/${a.appointment_id}/edit`} className="row">
                  <div className="flex w-12 shrink-0 flex-col">
                    <span className="tabular text-sm font-semibold text-primary">
                      {formatTime(a.scheduled_at)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content-strong">{a.title}</p>
                    <p className="mt-0.5 text-xs text-content-subtle">
                      {formatDate(a.scheduled_at)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Consultas recientes */}
      <section>
        <SectionHeader
          title="Consultas recientes"
          action={
            <Link
              to="/consultations"
              className="text-xs font-semibold text-primary transition-colors duration-200 hover:text-primary-600"
            >
              Ver todas
            </Link>
          }
        />
        {recent.data && recent.data.results.length > 0 ? (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {recent.data.results.map((c) => (
              <li key={c.consultation_id}>
                <Link to={`/consultations/${c.consultation_id}`} className="row">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content-strong">
                      {c.presumptive_diagnosis || c.reason || 'Consulta'}
                    </p>
                    <p className="mt-0.5 text-xs text-content-subtle">
                      {formatDate(c.consultation_date)}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-content-subtle" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-card border border-dashed border-line-strong px-4 py-6 text-sm text-content-muted">
            Aún no hay consultas registradas.
          </p>
        )}
      </section>
    </div>
  )
}

function Stat({
  to,
  icon: Icon,
  value,
  label,
}: {
  to: string
  icon: LucideIcon
  value: number | undefined
  label: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-1 px-4 py-4 transition-colors duration-200 hover:bg-sunken/60"
    >
      <Icon
        className="h-4 w-4 text-content-subtle transition-colors duration-200 group-hover:text-primary"
        strokeWidth={1.9}
      />
      <span className="tabular mt-1 text-2xl font-semibold leading-none text-content-strong">
        {value ?? '—'}
      </span>
      <span className="text-xs text-content-muted">{label}</span>
    </Link>
  )
}
