import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarClock, Plus, PawPrint, Check, Ban } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { SkeletonList, EmptyState, ErrorState } from '@/components/feedback/States'
import { useAppointments } from './hooks'
import { formatDate, formatTime } from '@/utils/format'
import { cn } from '@/lib/cn'
import type { Appointment } from '@/types/domain'

type Filter = 'upcoming' | 'past' | 'all'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'upcoming', label: 'Próximas' },
  { value: 'past', label: 'Pasadas' },
  { value: 'all', label: 'Todas' },
]

const STATE_CHIP: Record<Appointment['state'], { label: string; className: string }> = {
  scheduled: { label: 'Programada', className: 'bg-primary-50 text-primary-600' },
  done: { label: 'Atendida', className: 'bg-success-soft text-success' },
  cancelled: { label: 'Cancelada', className: 'bg-error-soft text-error' },
}

/** Agenda: próximas y pasadas citas, agrupadas por día. */
export function AgendaPage() {
  const navigate = useNavigate()
  const appointments = useAppointments()
  const [filter, setFilter] = useState<Filter>('upcoming')

  const now = new Date().toISOString()
  const rows = appointments.data?.results ?? []

  const filtered = useMemo(() => {
    if (filter === 'upcoming')
      return rows.filter((a) => a.scheduled_at >= now && a.state !== 'cancelled')
    if (filter === 'past')
      return rows.filter((a) => a.scheduled_at < now || a.state === 'cancelled').reverse()
    return rows
  }, [rows, filter, now])

  const groups = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of filtered) {
      const key = formatDate(a.scheduled_at)
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Citas programadas de la clínica."
        actions={
          <Button size="sm" onClick={() => navigate('/appointments/new')}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} /> Nueva cita
          </Button>
        }
      />

      {/* Filtros segmentados */}
      <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200',
              filter === f.value
                ? 'bg-primary-50 text-primary-600'
                : 'text-content-muted hover:text-content-strong',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {appointments.isLoading && <SkeletonList />}
        {appointments.isError && (
          <ErrorState
            message={(appointments.error as Error).message}
            onRetry={appointments.refetch}
          />
        )}
        {!appointments.isLoading && filtered.length === 0 && (
          <EmptyState
            icon={CalendarClock}
            title={filter === 'upcoming' ? 'No hay citas próximas' : 'Sin citas que mostrar'}
            description="Agenda una cita para llevar el control de controles, vacunas y cirugías."
            action={
              <Button onClick={() => navigate('/appointments/new')}>
                <Plus className="h-4 w-4" strokeWidth={2.25} /> Agendar cita
              </Button>
            }
          />
        )}

        <div className="space-y-7">
          {groups.map(([day, items]) => (
            <section key={day}>
              <h2 className="eyebrow mb-2">{day}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                {items.map((a) => {
                  const chip = STATE_CHIP[a.state]
                  return (
                    <li key={a.appointment_id}>
                      <Link to={`/appointments/${a.appointment_id}/edit`} className="row">
                        <div className="flex w-12 shrink-0 flex-col items-start">
                          <span className="tabular text-sm font-semibold text-content-strong">
                            {formatTime(a.scheduled_at)}
                          </span>
                          {a.state === 'done' && <Check className="mt-1 h-3 w-3 text-success" />}
                          {a.state === 'cancelled' && <Ban className="mt-1 h-3 w-3 text-error" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-content-strong">
                            {a.title}
                          </p>
                          {a.notes && (
                            <p className="mt-0.5 truncate text-xs text-content-subtle">{a.notes}</p>
                          )}
                          {a.patient_id && (
                            <span className="mt-1 inline-flex items-center gap-1 text-2xs text-content-subtle">
                              <PawPrint className="h-3 w-3" /> Mascota vinculada
                            </span>
                          )}
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-2xs font-semibold',
                            chip.className,
                          )}
                        >
                          {chip.label}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
