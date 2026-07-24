import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  PawPrint,
  Plus,
  Pencil,
  Phone,
  Stethoscope,
  Calendar,
  Trash2,
  FlaskConical,
  Syringe,
  IdCard,
  CalendarClock,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, ErrorState, EmptyState } from '@/components/feedback/States'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { WhatsAppMenu } from '@/components/WhatsAppMenu'
import { usePatient, usePatientHistory } from './hooks'
import { useStudyHistory } from '@/features/studies/hooks'
import { useInjectionHistory } from '@/features/injections/hooks'
import { usePatientAppointments } from '@/features/agenda/hooks'
import { patientService } from '@/services/patientService'
import { toast } from '@/stores/uiStore'
import { formatDate, formatDateTime, phoneDigits, phoneWithCountry } from '@/utils/format'

type Tab = 'consultas' | 'estudios' | 'inyecciones'

export function PatientDetailPage() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState<Tab>('consultas')
  const patient = usePatient(patientId)
  const history = usePatientHistory(patientId)
  const studies = useStudyHistory(patientId)
  const injections = useInjectionHistory(patientId)
  const appointments = usePatientAppointments(patientId)

  const remove = useMutation({
    mutationFn: () => patientService.softDelete(patientId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      if (patient.data?.owner) {
        qc.invalidateQueries({ queryKey: ['owner', patient.data.owner.owner_id, 'pets'] })
      }
      toast.success('Mascota eliminada')
      navigate(patient.data?.owner ? `/owners/${patient.data.owner.owner_id}` : '/patients')
    },
    onError: (e) => {
      setConfirmDelete(false)
      toast.error((e as Error).message)
    },
  })

  if (patient.isLoading) return <Skeleton className="mt-6 h-40" />
  if (patient.isError)
    return <ErrorState message={(patient.error as Error).message} onRetry={patient.refetch} />
  if (!patient.data) return null

  const p = patient.data
  const owner = p.owner
  const phone = phoneDigits(owner?.phone)
  const consultationCount = history.data?.results.length ?? 0
  const studyCount = studies.data?.results.length ?? 0
  const injectionCount = injections.data?.results.length ?? 0
  const nextAppointments = (appointments.data?.results ?? []).filter(
    (a) => a.state === 'scheduled' && a.scheduled_at >= new Date().toISOString(),
  )

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate('/patients')} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Expediente</h1>
      </header>

      {/* Encabezado del paciente */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PawPrint className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">{p.name}</h2>
            <p className="text-sm text-content-muted">
              {[p.species, p.breed, p.sex].filter(Boolean).join(' · ')}
              {p.approximate_age ? ` · ${p.approximate_age}` : ''}
            </p>
            {typeof p.weight === 'number' && p.weight > 0 && (
              <p className="text-sm text-content-muted">Peso: {p.weight} kg</p>
            )}
            {owner && (
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
                <span>
                  Tutor: <span className="font-medium">{owner.full_name}</span>
                  {owner.phone ? ` · ${owner.phone}` : ''}
                </span>
                <Link
                  to={`/owners/${owner.owner_id}/edit`}
                  className="inline-flex items-center gap-1 font-medium text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar tutor
                </Link>
              </p>
            )}
          </div>
        </div>

        {p.clinical_notes && (
          <div className="mt-3 rounded-lg bg-warning/10 p-2 text-sm text-content">
            <span className="font-medium text-warning">Alertas / notas: </span>
            {p.clinical_notes}
          </div>
        )}
      </div>

      {/* Registrar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ActionTile
          icon={Stethoscope}
          label="Consulta"
          onClick={() => navigate(`/patients/${p.patient_id}/consultations/new`)}
        />
        <ActionTile
          icon={FlaskConical}
          label="Estudio"
          onClick={() => navigate(`/patients/${p.patient_id}/studies/new`)}
        />
        <ActionTile
          icon={Syringe}
          label="Inyección"
          onClick={() => navigate(`/patients/${p.patient_id}/injections/new`)}
        />
        <ActionTile
          icon={CalendarClock}
          label="Cita"
          onClick={() => navigate(`/appointments/new?patientId=${p.patient_id}`)}
        />
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          to={`/carnet/${p.patient_id}`}
          className="card flex items-center gap-2 p-3 text-sm font-medium hover:bg-background"
        >
          <IdCard className="h-5 w-5 text-primary" /> Carnet sanitario
        </Link>
        <Button variant="ghost" onClick={() => navigate(`/patients/${p.patient_id}/edit`)}>
          <Pencil className="h-4 w-4" /> Editar mascota
        </Button>
        {phone && (
          <>
            <a href={`tel:+${phoneWithCountry(phone)}`} className="btn-ghost">
              <Phone className="h-4 w-4" /> Llamar
            </a>
            <WhatsAppMenu phone={phone} petName={p.name} ownerName={owner?.full_name} />
          </>
        )}
      </div>

      {/* Próximas citas */}
      {nextAppointments.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-content-muted">Próximas citas</h2>
          <ul className="space-y-2">
            {nextAppointments.slice(0, 3).map((a) => (
              <li key={a.appointment_id}>
                <Link
                  to={`/appointments/${a.appointment_id}/edit`}
                  className="card flex items-center gap-2 p-3 text-sm hover:bg-background"
                >
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{a.title}</span>
                  </span>
                  <span className="shrink-0 text-content-muted">{formatDateTime(a.scheduled_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Historiales con pestañas */}
      <section>
        <div className="mb-3 flex gap-1 rounded-xl bg-primary/5 p-1">
          <TabButton active={tab === 'consultas'} onClick={() => setTab('consultas')} count={consultationCount}>
            Consultas
          </TabButton>
          <TabButton active={tab === 'estudios'} onClick={() => setTab('estudios')} count={studyCount}>
            Estudios
          </TabButton>
          <TabButton active={tab === 'inyecciones'} onClick={() => setTab('inyecciones')} count={injectionCount}>
            Inyecciones
          </TabButton>
        </div>

        {tab === 'consultas' && (
          <TabPanel
            loading={history.isLoading}
            empty={consultationCount === 0}
            emptyIcon={Stethoscope}
            emptyTitle="Sin consultas aún"
            addLabel="Nueva consulta"
            onAdd={() => navigate(`/patients/${p.patient_id}/consultations/new`)}
          >
            {history.data?.results.map((c) => (
              <li key={c.consultation_id}>
                <Link
                  to={`/consultations/${c.consultation_id}`}
                  className="card block p-3 transition-colors hover:bg-background"
                >
                  <RecordDate date={c.consultation_date} time={c.attended_at}>
                    {c.consultation_type === 'follow_up' && (
                      <span className="chip bg-secondary/15 text-secondary">Seguimiento</span>
                    )}
                  </RecordDate>
                  <p className="mt-1 font-medium">
                    {c.presumptive_diagnosis || c.reason || 'Consulta'}
                  </p>
                  {c.reason && c.presumptive_diagnosis && (
                    <p className="truncate text-sm text-content-muted">{c.reason}</p>
                  )}
                </Link>
              </li>
            ))}
          </TabPanel>
        )}

        {tab === 'estudios' && (
          <TabPanel
            loading={studies.isLoading}
            empty={studyCount === 0}
            emptyIcon={FlaskConical}
            emptyTitle="Sin estudios complementarios"
            addLabel="Nuevo estudio"
            onAdd={() => navigate(`/patients/${p.patient_id}/studies/new`)}
          >
            {studies.data?.results.map((s) => (
              <li key={s.study_id}>
                <Link
                  to={`/studies/${s.study_id}/edit`}
                  className="card block p-3 transition-colors hover:bg-background"
                >
                  <RecordDate date={s.study_date} time={s.attended_at} />
                  <p className="mt-1 font-medium">{s.study_type || 'Estudio'}</p>
                  {s.findings && <p className="truncate text-sm text-content-muted">{s.findings}</p>}
                </Link>
              </li>
            ))}
          </TabPanel>
        )}

        {tab === 'inyecciones' && (
          <TabPanel
            loading={injections.isLoading}
            empty={injectionCount === 0}
            emptyIcon={Syringe}
            emptyTitle="Sin inyecciones registradas"
            addLabel="Nueva inyección"
            onAdd={() => navigate(`/patients/${p.patient_id}/injections/new`)}
          >
            {injections.data?.results.map((i) => (
              <li key={i.injection_id}>
                <Link
                  to={`/injections/${i.injection_id}/edit`}
                  className="card block p-3 transition-colors hover:bg-background"
                >
                  <RecordDate date={i.injection_date} time={i.attended_at} />
                  <p className="mt-1 font-medium">{i.product}</p>
                  <p className="truncate text-sm text-content-muted">
                    {[i.dose, i.route, i.site].filter(Boolean).join(' · ')}
                  </p>
                </Link>
              </li>
            ))}
          </TabPanel>
        )}
      </section>

      <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
        <Trash2 className="h-4 w-4" /> Eliminar mascota
      </Button>

      <ConfirmDialog
        open={confirmDelete}
        danger
        title={`¿Eliminar a ${p.name}?`}
        description="La mascota y su expediente se darán de baja."
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

function ActionTile({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Stethoscope
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card flex flex-col items-center gap-1 p-3 text-center transition-colors hover:bg-background"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex items-center gap-0.5 text-xs font-medium">
        <Plus className="h-3 w-3" /> {label}
      </span>
    </button>
  )
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-surface text-primary shadow-card' : 'text-content-muted hover:text-content'
      }`}
    >
      {children}
      {count > 0 && (
        <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-primary/10' : 'bg-border/60'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function TabPanel({
  loading,
  empty,
  emptyIcon,
  emptyTitle,
  addLabel,
  onAdd,
  children,
}: {
  loading: boolean
  empty: boolean
  emptyIcon: typeof Stethoscope
  emptyTitle: string
  addLabel: string
  onAdd: () => void
  children: ReactNode
}) {
  return (
    <div className="space-y-3">
      <Button variant="ghost" className="w-full" onClick={onAdd}>
        <Plus className="h-4 w-4" /> {addLabel}
      </Button>
      {loading && <Skeleton className="h-24" />}
      {!loading && empty ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description="Aún no hay registros." />
      ) : (
        <ol className="space-y-2">{children}</ol>
      )}
    </div>
  )
}

function RecordDate({
  date,
  time,
  children,
}: {
  date?: string
  time?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-content-muted">
      <Calendar className="h-3.5 w-3.5" />
      {formatDate(date)}
      {time && (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {formatDateTime(time).split(', ')[1] ?? ''}
        </span>
      )}
      {children}
    </div>
  )
}
