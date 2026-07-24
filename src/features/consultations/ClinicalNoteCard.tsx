import { useLayoutEffect, useRef, useState } from 'react'
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
import { formatDate, formatTime } from '@/utils/format'
import { parseCustomValues } from './customFields'
import { parseTreatmentItems, formatTreatmentItem } from './treatment'
import type { Consultation, Patient, Owner, ClinicSettings } from '@/types/domain'

type Variant = 'doctor' | 'tutor'
type FormatMode = 'auto' | '4:5' | '9:16' | '1:1'

const WIDTH = 1080
const PREVIEW_W = 320
const ACCENT = '#3A8FE0'
const ACCENT_SOFT = '#E7F1FC'
const INK = '#122740'
const MUTED = '#5A7189'

// Altura mínima por formato (ancho fijo 1080). "auto" se ajusta al contenido.
const MIN_HEIGHT: Record<FormatMode, number> = {
  auto: 0,
  '4:5': Math.round((WIDTH * 5) / 4), // 1350
  '9:16': Math.round((WIDTH * 16) / 9), // 1920
  '1:1': WIDTH, // 1080
}

const FORMAT_OPTIONS: { value: FormatMode; label: string }[] = [
  { value: 'auto', label: 'Sugerido' },
  { value: '4:5', label: '4:5' },
  { value: '1:1', label: '1:1' },
  { value: '9:16', label: '9:16' },
]

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
 * Imagen clínica / receta descargable para compartir por WhatsApp. Dos variantes:
 *  - "doctor": todos los datos registrados de la consulta.
 *  - "tutor": receta amable con indicaciones para el tutor.
 *
 * El ALTO de la imagen es AUTOMÁTICO: crece con el contenido, así nada se corta.
 */
export function ClinicalNoteCard({ consultation: c, patient, owner, settings }: Props) {
  const [variant, setVariant] = useState<Variant>('doctor')
  const [format, setFormat] = useState<FormatMode>('auto')
  const [generating, setGenerating] = useState(false)
  const [cardHeight, setCardHeight] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const scale = PREVIEW_W / WIDTH
  const accent = s(settings?.primary_color) || ACCENT
  const minHeight = MIN_HEIGHT[format]

  // Mide el alto real del card (respeta minHeight) para dimensionar la vista
  // previa: el transform:scale NO reduce la caja de layout, así que sin esto el
  // contenedor quedaría del alto sin escalar y aparecería un hueco enorme.
  // Se remide ante cualquier cambio de contenido, variante o formato.
  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.scrollHeight)
  }, [variant, format, c, patient, owner, settings])

  const download = async () => {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      const node = cardRef.current
      const dataUrl = await toPng(node, {
        width: WIDTH,
        height: node.scrollHeight,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
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

  const treatmentItems = parseTreatmentItems(c.treatment_items)
  const attendedTime = formatTime(c.attended_at)

  // Pie con datos de la clínica, incluyendo la cédula profesional.
  const footerParts = [
    s(settings?.vet_name),
    s(settings?.professional_id) ? `Cédula profesional: ${s(settings?.professional_id)}` : '',
    s(settings?.phone),
    s(settings?.address),
  ].filter(Boolean)

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
          title="Receta / tutor"
          desc="Indicaciones amables"
        />
      </div>

      {/* Selector de formato: "Sugerido" ajusta al contenido; el resto fija una
          proporción mínima (nunca corta: si el contenido es mayor, crece). */}
      <div>
        <p className="mb-1 text-xs font-medium text-content-muted">Formato de imagen</p>
        <div className="grid grid-cols-4 gap-2">
          {FORMAT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setFormat(o.value)}
              className={`rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
                format === o.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-content-muted hover:bg-background'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={download} loading={generating} className="w-full">
        <Download className="h-4 w-4" /> Descargar PNG
      </Button>

      {/* Vista previa escalada. El contenedor toma el alto medido × escala para
          que no aparezca espacio en blanco de más. */}
      <div
        className="mx-auto overflow-hidden rounded-xl border border-border shadow-card"
        style={{ width: PREVIEW_W, height: cardHeight ? cardHeight * scale : undefined }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: WIDTH }}>
          <div
            ref={cardRef}
            style={{ width: WIDTH, minHeight, color: INK }}
            className="flex flex-col bg-white font-sans"
          >
            {/* Encabezado */}
            <div style={{ background: accent }} className="px-14 pb-9 pt-12 text-white">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 text-5xl">
                  🩺
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[46px] font-extrabold leading-tight">
                    {s(settings?.clinic_name) || 'VetNote'}
                  </p>
                  {s(settings?.vet_name) && (
                    <p className="text-[26px] text-white/85">{s(settings?.vet_name)}</p>
                  )}
                </div>
                <div className="text-right text-[24px] text-white/85">
                  <p>{formatDate(c.consultation_date) || formatDate(new Date().toISOString())}</p>
                  {attendedTime && <p>{attendedTime} h</p>}
                </div>
              </div>
              <div className="mt-3 inline-flex rounded-full bg-white/15 px-5 py-2 text-[22px] font-semibold uppercase tracking-wide">
                {variant === 'tutor' ? 'Receta / indicaciones' : 'Nota clínica'}
              </div>
            </div>

            {/* Banner del paciente */}
            <div className="mx-14 -mt-6 rounded-2xl bg-white px-8 py-6 shadow-[0_10px_30px_rgba(24,71,122,0.14)]">
              <p className="text-[52px] font-bold leading-tight">{s(patient?.name) || 'Paciente'}</p>
              <p className="text-[26px]" style={{ color: MUTED }}>
                {[meta, weight].filter(Boolean).join(' · ')}
              </p>
              {s(owner?.full_name) && (
                <p className="mt-1 text-[24px]" style={{ color: accent }}>
                  Tutor: {s(owner?.full_name)}
                </p>
              )}
            </div>

            {/* Cuerpo clínico */}
            <div className="flex-1 space-y-6 px-14 pt-8 text-[30px] leading-snug">
              {variant === 'tutor' ? (
                <TutorBody c={c} owner={owner} patient={patient} accent={accent} items={treatmentItems} />
              ) : (
                <DoctorBody c={c} exam={exam} vitals={vitals} accent={accent} items={treatmentItems} />
              )}
            </div>

            {/* Pie */}
            <div
              className="mt-8 px-14 py-8 text-[24px]"
              style={{ borderTop: `3px solid ${ACCENT_SOFT}`, color: MUTED }}
            >
              {variant === 'tutor' && (
                <p className="mb-2 text-[26px] font-semibold" style={{ color: accent }}>
                  Ante cualquier duda, contáctanos. ¡Gracias por confiar en nosotros!
                </p>
              )}
              {footerParts.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              {s(settings?.note_footer) && <p className="mt-1">{s(settings?.note_footer)}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-content-muted">
        <ImageIcon className="h-3.5 w-3.5" />
        {variant === 'tutor'
          ? 'Receta amable: indicaciones para el tutor.'
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

function TreatmentBlock({
  items,
  freeText,
  accent,
}: {
  items: ReturnType<typeof parseTreatmentItems>
  freeText: string
  accent: string
}) {
  if (items.length === 0 && !freeText) return null
  return (
    <div style={{ borderLeft: `6px solid ${ACCENT_SOFT}`, paddingLeft: 20 }}>
      <Label accent={accent}>Tratamiento</Label>
      {items.map((it, i) => (
        <p key={i} className="mb-1">
          • {formatTreatmentItem(it)}
        </p>
      ))}
      {freeText && <p className={items.length ? 'mt-1' : undefined}>{freeText}</p>}
    </div>
  )
}

function DoctorBody({
  c,
  exam,
  vitals,
  accent,
  items,
}: {
  c: Partial<Consultation>
  exam: [string, string][]
  vitals: string[]
  accent: string
  items: ReturnType<typeof parseTreatmentItems>
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
      <TreatmentBlock items={items} freeText={s(c.treatment)} accent={accent} />
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
  items,
}: {
  c: Partial<Consultation>
  owner?: Pick<Owner, 'full_name'> | null
  patient?: Pick<Patient, 'name'> | null
  accent: string
  items: ReturnType<typeof parseTreatmentItems>
}) {
  const greetName = firstName(owner?.full_name)
  const petName = s(patient?.name) || 'tu mascota'
  return (
    <>
      <p className="text-[30px]" style={{ color: MUTED }}>
        {greetName ? `Hola ${greetName}, ` : 'Hola, '}
        estas son las indicaciones para <span className="font-semibold">{petName}</span>.
      </p>
      <Section title="Motivo de la visita" value={s(c.reason)} accent={accent} />
      <Section title="Diagnóstico" value={s(c.presumptive_diagnosis)} accent={accent} strong />
      <TreatmentBlock items={items} freeText={s(c.treatment)} accent={accent} />
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
