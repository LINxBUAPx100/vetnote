import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PawPrint,
  Plus,
  Pencil,
  Phone,
  Stethoscope,
  Trash2,
  FlaskConical,
  Syringe,
  IdCard,
  CalendarClock,
  ChevronRight,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader'
import { Skeleton, SkeletonList, ErrorState, EmptyState } from '@/components/feedback/States'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { WhatsAppMenu } from '@/components/WhatsAppMenu'
import { usePatient, usePatientHistory } from './hooks'
import { useStudyHistory } from '@/features/studies/hooks'
import { useInjectionHistory } from '@/features/injections/hooks'
import { usePatientAppointments } from '@/features/agenda/hooks'
import { patientService } from '@/services/patientService'
import { toast } from '@/stores/uiStore'
import { cn } from '@/lib/cn'
import {
  formatDate,
  formatTime,
  phoneDigits,
  phoneWithCountry,
  normalizePhoneDisplay,
} from '@/utils/format'

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

  if (patient.isLoading) return <Skeleton className="mt-6 h-48" />
  if (patient.isError)
    return <ErrorState message={(patient.error as Error).message} onRetry={patient.refetch} />
  if (!patient.data) return null

  const p = patient.data
  const owner = p.owner
  const phone = phoneDigits(owner?.phone)
  const counts = {
    consultas: history.data?.results.length ?? 0,
    estudios: studies.data?.results.length ?? 0,
    inyecciones: injections.data?.results.length ?? 0,
  }
  const nextAppointments = (appointments.data?.results ?? []).filter(
    (a) => a.state === 'scheduled' && a.scheduled_at >= new Date().toISOString(),
  )
  const traits = [p.species, p.breed, p.sex, p.color].filter(Boolean).join(' · ')

  return (
    <div className="pb-4">
      <PageHeader eyebrow="Expediente" title={p.name} back="/patients" />

      {/* Identidad: datos clave sin caja pesada */}
      <section className="border-b border-line pb-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"
            aria-hidden
          >
            <PawPrint className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-content-muted">{traits || 'Sin datos de identificación'}</p>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {typeof p.weight === 'number' && p.weight > 0 && (
                <Meta label="Peso" value={`${p.weight} kg`} />
              )}
              {p.approximate_age && <Meta label="Edad" value={p.approximate_age} />}
              {p.birth_date && <Meta label="Nacimiento" value={formatDate(p.birth_date)} />}
              {p.microchip && <Meta label="Microchip" value={p.microchip} />}
            </dl>
          </div>
        </div>

        {owner && (
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-content-muted">Tutor</span>
            <Link
              to={`/owners/${owner.owner_id}`}
              className="font-medium text-content-strong underline decoration-line-strong underline-offset-4 transition-colors duration-200 hover:decoration-primary"
            >
              {owner.full_name}
            </Link>
            {owner.phone && (
              <span className="tabular text-content-subtle">
                · {normalizePhoneDisplay(owner.phone)}
              </span>
            )}
          </div>
        )}

        {p.clinical_notes && (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-warning/20 bg-warning-soft px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.9} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-content-strong">Alertas y notas</p>
              <p className="mt-0.5 text-sm text-content">{p.clinical_notes}</p>
            </div>
          </div>
        )}
      </section>

      {/* Registrar */}
      <section className="border-b border-line py-6">
        <SectionHeader title="Registrar" />
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

        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/carnet/${p.patient_id}`} className="btn-ghost px-3">
            <IdCard className="h-4 w-4" strokeWidth={1.9} /> Carnet
          </Link>
          <Button
            variant="ghost"
            className="px-3"
            onClick={() => navigate(`/patients/${p.patient_id}/edit`)}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.9} /> Editar
          </Button>
          {phone && (
            <>
              <a href={`tel:+${phoneWithCountry(phone)}`} className="btn-ghost px-3">
                <Phone className="h-4 w-4" strokeWidth={1.9} /> Llamar
              </a>
              <WhatsAppMenu
                phone={phone}
                petName={p.name}
                petSex={p.sex}
                ownerName={owner?.full_name}
                className="w-auto"
              />
            </>
          )}
        </div>
      </section>

      {/* Próximas citas */}
      {nextAppointments.length > 0 && (
        <section className="border-b border-line py-6">
          <SectionHeader title="Próximas citas" />
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {nextAppointments.slice(0, 3).map((a) => (
              <li key={a.appointment_id}>
                <Link to={`/appointments/${a.appointment_id}/edit`} className="row">
                  <CalendarClock className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.9} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-content-strong">
                    {a.title}
                  </span>
                  <span className="tabular shrink-0 text-xs text-content-subtle">
                    {formatDate(a.scheduled_at)} · {formatTime(a.scheduled_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Historiales */}
      <section className="py-6">
        <div className="mb-4 flex gap-1 border-b border-line">
          <TabButton active={tab === 'consultas'} onClick={() => setTab('consultas')} count={counts.consultas}>
            Consultas
          </TabButton>
          <TabButton active={tab === 'estudios'} onClick={() => setTab('estudios')} count={counts.estudios}>
            Estudios
          </TabButton>
          <TabButton
            active={tab === 'inyecciones'}
            onClick={() => setTab('inyecciones')}
            count={counts.inyecciones}
          >
            Inyecciones
          </TabButton>
        </div>

        {tab === 'consultas' && (
          <TabPanel
            loading={history.isLoading}
            empty={counts.consultas === 0}
            icon={Stethoscope}
            emptyTitle="Sin consultas aún"
            emptyDesc="Registra la primera consulta para iniciar el historial clínico."
            addLabel="Nueva consulta"
            onAdd={() => navigate(`/patients/${p.patient_id}/consultations/new`)}
          >
            {history.data?.results.map((c) => (
              <RecordRow
                key={c.consultation_id}
                to={`/consultations/${c.consultation_id}`}
                title={c.presumptive_diagnosis || c.reason || 'Consulta'}
                subtitle={c.reason && c.presumptive_diagnosis ? c.reason : undefined}
                date={c.consultation_date}
                time={c.attended_at}
                tag={c.consultation_type === 'follow_up' ? 'Seguimiento' : undefined}
              />
            ))}
          </TabPanel>
        )}

        {tab === 'estudios' && (
          <TabPanel
            loading={studies.isLoading}
            empty={counts.estudios === 0}
            icon={FlaskConical}
            emptyTitle="Sin estudios complementarios"
            emptyDesc="Laboratorio, imagenología y pruebas rápidas quedan aquí."
            addLabel="Nuevo estudio"
            onAdd={() => navigate(`/patients/${p.patient_id}/studies/new`)}
          >
            {studies.data?.results.map((s) => (
              <RecordRow
                key={s.study_id}
                to={`/studies/${s.study_id}/edit`}
                title={s.study_type || 'Estudio'}
                subtitle={s.findings}
                date={s.study_date}
                time={s.attended_at}
              />
            ))}
          </TabPanel>
        )}

        {tab === 'inyecciones' && (
          <TabPanel
            loading={injections.isLoading}
            empty={counts.inyecciones === 0}
            icon={Syringe}
            emptyTitle="Sin inyecciones registradas"
            emptyDesc="Lleva el control de aplicaciones, dosis y vía."
            addLabel="Nueva inyección"
            onAdd={() => navigate(`/patients/${p.patient_id}/injections/new`)}
          >
            {injections.data?.results.map((i) => (
              <RecordRow
                key={i.injection_id}
                to={`/injections/${i.injection_id}/edit`}
                title={i.product}
                subtitle={[i.dose, i.route, i.site].filter(Boolean).join(' · ')}
                date={i.injection_date}
                time={i.attended_at}
              />
            ))}
          </TabPanel>
        )}
      </section>

      {/* Zona destructiva, separada del flujo principal */}
      <section className="mt-4 border-t border-line pt-6">
        <Button variant="dangerSubtle" size="sm" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} /> Eliminar mascota
        </Button>
      </section>

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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="tabular mt-0.5 text-sm font-medium text-content-strong">{value}</dd>
    </div>
  )
}

function ActionTile({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-3 text-left transition-all duration-200 hover:border-primary-200 hover:bg-primary-50/50"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white"
        aria-hidden
      >
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 text-xs font-semibold text-content-strong">{label}</span>
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
      aria-pressed={active}
      className={cn(
        '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'border-primary text-content-strong'
          : 'border-transparent text-content-muted hover:border-line-strong hover:text-content-strong',
      )}
    >
      {children}
      {count > 0 && (
        <span
          className={cn(
            'tabular rounded-full px-1.5 py-0.5 text-2xs font-semibold transition-colors duration-200',
            active ? 'bg-primary-50 text-primary-600' : 'bg-sunken text-content-subtle',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function TabPanel({
  loading,
  empty,
  icon,
  emptyTitle,
  emptyDesc,
  addLabel,
  onAdd,
  children,
}: {
  loading: boolean
  empty: boolean
  icon: LucideIcon
  emptyTitle: string
  emptyDesc: string
  addLabel: string
  onAdd: () => void
  children: ReactNode
}) {
  if (loading) return <SkeletonList rows={2} />
  if (empty)
    return (
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyDesc}
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} /> {addLabel}
          </Button>
        }
      />
    )

  return (
    <div className="animate-fade-in">
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {children}
      </ul>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors duration-200 hover:text-primary-600"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} /> {addLabel}
      </button>
    </div>
  )
}

function RecordRow({
  to,
  title,
  subtitle,
  date,
  time,
  tag,
}: {
  to: string
  title: string
  subtitle?: string
  date?: string
  time?: string
  tag?: string
}) {
  return (
    <li>
      <Link to={to} className="row">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-content-strong">{title}</p>
            {tag && <span className="chip-neutral shrink-0">{tag}</span>}
          </div>
          {subtitle && <p className="mt-0.5 truncate text-xs text-content-muted">{subtitle}</p>}
          <p className="tabular mt-0.5 text-xs text-content-subtle">
            {formatDate(date)}
            {time ? ` · ${formatTime(time)}` : ''}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-content-subtle" strokeWidth={1.9} />
      </Link>
    </li>
  )
}
