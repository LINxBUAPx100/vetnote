import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  Download,
  Image as ImageIcon,
  RefreshCw,
  Loader2,
  Stethoscope,
  HeartHandshake,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/uiStore'
import { formatDate } from '@/utils/format'
import { parseCustomValues } from './customFields'
import type { Consultation, Patient, Owner, ClinicSettings } from '@/types/domain'

type Format = '1080x1350' | '1080x1920'
type Variant = 'doctor' | 'tutor'

const DIMENSIONS: Record<Format, { w: number; h: number }> = {
  '1080x1350': { w: 1080, h: 1350 },
  '1080x1920': { w: 1080, h: 1920 },
}
const PREVIEW_W = 300
const ACCENT = '#2F6F64'
const ACCENT_SOFT = '#EAF2F0'
const INK = '#1F2933'
const MUTED = '#667085'

interface Props {
  consultation: Partial<Consultation>
  patient?: Pick<Patient, 'name' | 'species' | 'breed' | 'approximate_age' | 'weight'> | null
  owner?: Pick<Owner, 'full_name'> | null
  settings?: ClinicSettings | null
}

function s(v?: string | number | null): string {
  return v === null || v === undefined ? '' : String(v).trim()
}

function firstName(full?: string): string {
  const n = s(full)
  return n ? (n.split(/\s+/)[0] ?? n) : ''
}

/**
 * Imagen clínica descargable para compartir por WhatsApp. Dos variantes:
 *  - "doctor": todos los datos registrados de la consulta.
 *  - "tutor": resumen amable con lo que el tutor necesita ver.
 */
export function ClinicalNoteCard({ consultation: c, patient, owner, settings }: Props) {
  const [fmt, setFmt] = useState<Format>('1080x1350')
  const [variant, setVariant] = useState<Variant>('doctor')
  const [generating, setGenerating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const dim = DIMENSIONS[fmt]
  const scale = PREVIEW_W / dim.w
  const accent = s(settings?.primary_color) || ACCENT

  const download = async () => {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: dim.w,
        height: dim.h,
        pixelRatio: 2,
        cacheBust: true,
        style: { transform: 'none', margin: '0' },
      })
      const link = document.createElement('a')
      const fecha = formatDate(c.consultation_date, 'yyyyMMdd') || 'consulta'
      link.download = `vetnote-${variant}-${s(patient?.name) || 'consulta'}-${fecha}.png`.replace(
        /\s+/g,
        '_',
      )
      link.href = dataUrl
      link.click()
      toast.success('Imagen generada')
    } catch {
      toast.error('No se pudo generar la imagen')
    } finally {
      setGenerating(false)
    }
  }

  const meta = [s(patient?.species), s(patient?.breed), s(patient?.approximate_age)]
    .filter(Boolean)
    .join(' · ')
  const weight =
    typeof patient?.weight === 'number' && patient.weight > 0 ? `${patient.weight} kg` : ''

  const exam = [
    s(c.head_neck) && ['Cabeza y cuello', s(c.head_neck)],
    s(c.thorax_forelimbs) && ['Tórax y MAs', s(c.thorax_forelimbs)],
    s(c.abdomen_hindlimbs_anus_tail) && ['Abdomen, MPs, ano y cola', s(c.abdomen_hindlimbs_anus_tail)],
    s(c.additional_exam) && ['Hallazgos adicionales', s(c.additional_exam)],
  ].filter(Boolean) as [string, string][]

  const vitals = [
    s(c.temperature) && `T° ${s(c.temperature)}`,
    s(c.heart_rate) && `FC ${s(c.heart_rate)}`,
    s(c.respiratory_rate) && `FR ${s(c.respiratory_rate)}`,
    s(c.mucous_membranes) && `Mucosas: ${s(c.mucous_membranes)}`,
    s(c.hydration) && `Hidratación: ${s(c.hydration)}`,
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-3">
      {/* Selector de destinatario */}
      <div className="grid grid-cols-2 gap-2">
        <VariantButton
          active={variant === 'doctor'}
          onClick={() => setVariant('doctor')}
          icon={Stethoscope}
          title="Para el doctor"
          desc="Todos los datos"
        />
        <VariantButton
          active={variant === 'tutor'}
          onClick={() => setVariant('tutor')}
          icon={HeartHandshake}
          title="Para el tutor"
          desc="Resumen amable"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={fmt}
          onChange={(e) => setFmt(e.target.value as Format)}
          aria-label="Formato de imagen"
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        >
          <option value="1080x1350">Vertical 4:5 (WhatsApp)</option>
          <option value="1080x1920">Story 9:16</option>
        </select>
        <Button onClick={download} loading={generating} className="flex-1">
          <Download className="h-4 w-4" /> Descargar PNG
        </Button>
      </div>

      {/* Vista previa escalada (el nodo real se exporta a tamaño completo). */}
      <div
        className="mx-auto overflow-hidden rounded-xl border border-border shadow-card"
        style={{ width: PREVIEW_W, height: Math.round(dim.h * scale) }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <div
            ref={cardRef}
            style={{ width: dim.w, height: dim.h, color: INK }}
            className="flex flex-col overflow-hidden bg-white font-sans"
          >
            {/* Encabezado */}
            <div style={{ background: accent }} className="px-14 pb-9 pt-12 text-white">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 text-5xl">
                  🩺
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[46px] font-extrabold leading-tight">
                    {s(settings?.clinic_name) || 'VetNote'}
                  </p>
                  {s(settings?.vet_name) && (
                    <p className="text-[26px] text-white/85">{s(settings?.vet_name)}</p>
                  )}
                </div>
                <div className="text-right text-[24px] text-white/85">
                  {formatDate(c.consultation_date) || formatDate(new Date().toISOString())}
                </div>
              </div>
              <div className="mt-3 inline-flex rounded-full bg-white/15 px-5 py-2 text-[22px] font-semibold uppercase tracking-wide">
                {variant === 'tutor' ? 'Resumen para el tutor' : 'Nota clínica'}
              </div>
            </div>

            {/* Banner del paciente */}
            <div className="mx-14 -mt-6 rounded-2xl bg-white px-8 py-6 shadow-[0_10px_30px_rgba(31,41,51,0.12)]">
              <p className="text-[52px] font-bold leading-tight">{s(patient?.name) || 'Paciente'}</p>
              <p className="text-[26px]" style={{ color: MUTED }}>
                {[meta, weight].filter(Boolean).join(' · ')}
              </p>
              {variant === 'tutor' && s(owner?.full_name) && (
                <p className="mt-1 text-[24px]" style={{ color: accent }}>
                  Tutor: {s(owner?.full_name)}
                </p>
              )}
            </div>

            {/* Cuerpo clínico */}
            <div className="flex-1 space-y-6 px-14 pt-8 text-[30px] leading-snug">
              {variant === 'tutor' ? (
                <TutorBody c={c} owner={owner} patient={patient} accent={accent} />
              ) : (
                <DoctorBody c={c} exam={exam} vitals={vitals} accent={accent} />
              )}
            </div>

            {/* Pie */}
            <div
              className="mt-auto px-14 py-7 text-[24px]"
              style={{ borderTop: `3px solid ${ACCENT_SOFT}`, color: MUTED }}
            >
              {variant === 'tutor' && (
                <p className="mb-1 text-[26px] font-semibold" style={{ color: accent }}>
                  Ante cualquier duda, contáctanos. ¡Gracias por confiar en nosotros!
                </p>
              )}
              {[s(settings?.phone), s(settings?.address)].filter(Boolean).join('  ·  ')}
              {s(settings?.note_footer) ? ` — ${s(settings?.note_footer)}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-content-muted">
        <ImageIcon className="h-3.5 w-3.5" />
        {variant === 'tutor'
          ? 'Versión amable: resumen para enviar al tutor.'
          : 'Versión completa: incluye todos los datos clínicos.'}
        <button onClick={download} className="ml-auto flex items-center gap-1 text-primary">
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Regenerar
        </button>
      </div>
    </div>
  )
}

function VariantButton({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Stethoscope
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-surface text-content hover:bg-background'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">{title}</span>
        <span className="block text-xs text-content-muted">{desc}</span>
      </span>
    </button>
  )
}

function DoctorBody({
  c,
  exam,
  vitals,
  accent,
}: {
  c: Partial<Consultation>
  exam: [string, string][]
  vitals: string[]
  accent: string
}) {
  return (
    <>
      <Section title="Motivo" value={s(c.reason)} accent={accent} />
      <Section title="Anamnesis actual" value={s(c.current_anamnesis)} accent={accent} />
      <Section title="Anamnesis remota" value={s(c.remote_anamnesis)} accent={accent} />
      {vitals.length > 0 && (
        <div>
          <Label accent={accent}>Signos vitales</Label>
          <div className="flex flex-wrap gap-2">
            {vitals.map((v) => (
              <span
                key={v}
                className="rounded-lg px-3 py-1 text-[26px]"
                style={{ background: ACCENT_SOFT }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
      {exam.length > 0 && (
        <div>
          <Label accent={accent}>Examen físico</Label>
          {exam.map(([label, val]) => (
            <p key={label} className="mb-1">
              <span className="font-semibold">{label}: </span>
              {val}
            </p>
          ))}
        </div>
      )}
      <Section title="Diagnóstico presuntivo" value={s(c.presumptive_diagnosis)} accent={accent} strong />
      <Section title="Diagnósticos diferenciales" value={s(c.differential_diagnosis)} accent={accent} />
      <Section title="Tratamiento" value={s(c.treatment)} accent={accent} />
      <Section title="Recomendaciones" value={s(c.recommendations)} accent={accent} />
      {parseCustomValues(c.custom_values).map((f) => (
        <Section key={f.label} title={f.label} value={f.value} accent={accent} />
      ))}
      {s(c.follow_up_date) && (
        <Section title="Seguimiento" value={formatDate(c.follow_up_date)} accent={accent} />
      )}
    </>
  )
}

function TutorBody({
  c,
  owner,
  patient,
  accent,
}: {
  c: Partial<Consultation>
  owner?: Pick<Owner, 'full_name'> | null
  patient?: Pick<Patient, 'name'> | null
  accent: string
}) {
  const greetName = firstName(owner?.full_name)
  const petName = s(patient?.name) || 'tu mascota'
  return (
    <>
      <p className="text-[30px]" style={{ color: MUTED }}>
        {greetName ? `Hola ${greetName}, ` : 'Hola, '}
        este es el resumen de la visita de <span className="font-semibold">{petName}</span>.
      </p>
      <Section title="Motivo de la visita" value={s(c.reason)} accent={accent} />
      <Section title="Diagnóstico" value={s(c.presumptive_diagnosis)} accent={accent} strong />
      <Section title="Tratamiento indicado" value={s(c.treatment)} accent={accent} />
      <Section title="Cuidados en casa" value={s(c.recommendations)} accent={accent} />
      {s(c.follow_up_date) && (
        <Section title="Próxima revisión" value={formatDate(c.follow_up_date)} accent={accent} strong />
      )}
    </>
  )
}

function Label({ children, accent }: { children: string; accent: string }) {
  return (
    <p className="mb-1 text-[26px] font-bold uppercase tracking-wide" style={{ color: accent }}>
      {children}
    </p>
  )
}

function Section({
  title,
  value,
  accent,
  strong,
}: {
  title: string
  value: string
  accent: string
  strong?: boolean
}) {
  if (!value) return null
  return (
    <div style={{ borderLeft: `6px solid ${ACCENT_SOFT}`, paddingLeft: 20 }}>
      <Label accent={accent}>{title}</Label>
      <p className={strong ? 'font-semibold' : undefined}>{value}</p>
    </div>
  )
}
