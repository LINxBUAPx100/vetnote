import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarClock, Plus, PawPrint, Check, Ban } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, EmptyState, ErrorState } from '@/components/feedback/States'
import { useAppointments } from './hooks'
import { formatDate, formatTime } from '@/utils/format'
import type { Appointment } from '@/types/domain'

type Filter = 'upcoming' | 'past' | 'all'

const STATE_CHIP: Record<Appointment['state'], { label: string; className: string }> = {
  scheduled: { label: 'Programada', className: 'bg-primary/10 text-primary' },
  done: { label: 'Atendida', className: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelada', className: 'bg-error/10 text-error' },
}

/** Agenda: próximas y pasadas citas. */
export function AgendaPage() {
  const navigate = useNavigate()
  const appointments = useAppointments()
  const [filter, setFilter] = useState<Filter>('upcoming')

  const now = new Date().toISOString()
  const rows = appointments.data?.results ?? []

  const filtered = useMemo(() => {
    const list =
      filter === 'upcoming'
        ? rows.filter((a) => a.scheduled_at >= now && a.state !== 'cancelled')
        : filter === 'past'
          ? rows.filter((a) => a.scheduled_at < now || a.state === 'cancelled').reverse()
          : rows
    return list
  }, [rows, filter, now])

  // Agrupa por día (etiqueta de fecha legible).
  const groups = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of filtered) {
      const key = formatDate(a.scheduled_at)
      const arr = map.get(key) ?? []
      arr.push(a)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Agenda</h1>
        <Button className="px-3" onClick={() => navigate('/appointments/new')}>
          <Plus className="h-4 w-4" /> Nueva cita
        </Button>
      </header>

      <div className="flex gap-1 rounded-xl bg-primary/5 p-1">
        {(['upcoming', 'past', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
              filter === f ? 'bg-surface text-primary shadow-card' : 'text-content-muted'
            }`}
          >
            {f === 'upcoming' ? 'Próximas' : f === 'past' ? 'Pasadas' : 'Todas'}
          </button>
        ))}
      </div>

      {appointments.isLoading && <Skeleton className="h-24" />}
      {appointments.isError && (
        <ErrorState message={(appointments.error as Error).message} onRetry={appointments.refetch} />
      )}
      {!appointments.isLoading && filtered.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="Sin citas"
          description="Agenda una cita con el botón Nueva cita."
        />
      )}

      <div className="space-y-4">
        {groups.map(([day, items]) => (
          <section key={day}>
            <h2 className="mb-2 text-sm font-semibold capitalize text-content-muted">{day}</h2>
            <ul className="space-y-2">
              {items.map((a) => {
                const chip = STATE_CHIP[a.state]
                return (
                  <li key={a.appointment_id}>
                    <Link
                      to={`/appointments/${a.appointment_id}/edit`}
                      className="card flex items-center gap-3 p-3 hover:bg-background"
                    >
                      <div className="flex w-14 shrink-0 flex-col items-center">
                        <span className="text-lg font-bold leading-none text-primary">
                          {formatTime(a.scheduled_at)}
                        </span>
                        {a.state === 'done' && <Check className="mt-1 h-4 w-4 text-success" />}
                        {a.state === 'cancelled' && <Ban className="mt-1 h-4 w-4 text-error" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{a.title}</p>
                        {a.notes && (
                          <p className="truncate text-sm text-content-muted">{a.notes}</p>
                        )}
                        {a.patient_id && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs text-content-muted">
                            <PawPrint className="h-3 w-3" /> Mascota vinculada
                          </span>
                        )}
                      </div>
                      <span className={`chip shrink-0 ${chip.className}`}>{chip.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
