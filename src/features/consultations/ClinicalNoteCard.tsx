import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Image as ImageIcon, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/uiStore'
import { formatDate } from '@/utils/format'
import type { Consultation, Patient, ClinicSettings } from '@/types/domain'

type Format = '1080x1350' | '1080x1920'
const DIMENSIONS: Record<Format, { w: number; h: number }> = {
  '1080x1350': { w: 1080, h: 1350 },
  '1080x1920': { w: 1080, h: 1920 },
}
const PREVIEW_W = 300

interface Props {
  consultation: Partial<Consultation>
  patient?: Pick<Patient, 'name' | 'species' | 'breed' | 'approximate_age' | 'weight'> | null
  settings?: ClinicSettings | null
}

function s(v?: string | number | null): string {
  return v === null || v === undefined ? '' : String(v).trim()
}

/** Genera una imagen clínica descargable, optimizada para compartir por WhatsApp. */
export function ClinicalNoteCard({ consultation: c, patient, settings }: Props) {
  const [fmt, setFmt] = useState<Format>('1080x1350')
  const [generating, setGenerating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const dim = DIMENSIONS[fmt]
  const scale = PREVIEW_W / dim.w

  const download = async () => {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: dim.w,
        height: dim.h,
        pixelRatio: 2, // nitidez alta
        cacheBust: true,
        style: { transform: 'none', margin: '0' },
      })
      const link = document.createElement('a')
      const fecha = formatDate(c.consultation_date, 'yyyyMMdd') || 'consulta'
      link.download = `vetnote-${s(patient?.name) || 'consulta'}-${fecha}.png`.replace(/\s+/g, '_')
      link.href = dataUrl
      link.click()
      toast.success('Imagen generada')
    } catch {
      toast.error('No se pudo generar la imagen')
    } finally {
      setGenerating(false)
    }
  }

  const exam = [
    s(c.head_neck) && ['Cabeza y cuello', s(c.head_neck)],
    s(c.thorax_forelimbs) && ['Tórax y MAs', s(c.thorax_forelimbs)],
    s(c.abdomen_hindlimbs_anus_tail) && ['Abdomen, MPs, ano y cola', s(c.abdomen_hindlimbs_anus_tail)],
  ].filter(Boolean) as [string, string][]

  const meta = [s(patient?.species), s(patient?.breed), s(patient?.approximate_age)]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-3">
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
            style={{ width: dim.w, height: dim.h }}
            className="flex flex-col overflow-hidden bg-white font-sans text-[#1F2933]"
          >
            {/* Barra superior de marca */}
            <div className="h-4 w-full bg-[#2F6F64]" />

            {/* Encabezado */}
            <div className="flex items-center gap-5 px-14 pt-10">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#2F6F64] text-5xl text-white">
                🩺
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[44px] font-extrabold leading-tight">
                  {s(settings?.clinic_name) || 'VetNote'}
                </p>
                {s(settings?.vet_name) && (
                  <p className="text-[26px] text-[#667085]">{s(settings?.vet_name)}</p>
                )}
              </div>
              <div className="text-right text-[24px] text-[#667085]">
                {formatDate(c.consultation_date) || formatDate(new Date().toISOString())}
              </div>
            </div>

            {/* Banner del paciente */}
            <div className="mx-14 mt-8 rounded-2xl bg-[#F5F7F6] px-8 py-6">
              <p className="text-[52px] font-bold leading-tight">{s(patient?.name) || 'Paciente'}</p>
              <p className="text-[26px] text-[#667085]">
                {meta}
                {typeof patient?.weight === 'number' && patient.weight > 0 ? ` · ${patient.weight} kg` : ''}
              </p>
            </div>

            {/* Cuerpo clínico */}
            <div className="flex-1 space-y-6 px-14 pt-8 text-[30px] leading-snug">
              <Section title="Motivo" value={s(c.reason)} />
              <Section title="Anamnesis actual" value={s(c.current_anamnesis)} />
              {exam.length > 0 && (
                <div>
                  <p className="mb-1 text-[26px] font-bold uppercase tracking-wide text-[#2F6F64]">
                    Examen físico
                  </p>
                  {exam.map(([label, val]) => (
                    <p key={label} className="mb-1">
                      <span className="font-semibold">{label}: </span>
                      {val}
                    </p>
                  ))}
                </div>
              )}
              <Section title="Diagnóstico presuntivo" value={s(c.presumptive_diagnosis)} strong />
              <Section title="Tratamiento" value={s(c.treatment)} />
              <Section title="Recomendaciones" value={s(c.recommendations)} />
              {s(c.follow_up_date) && (
                <Section title="Seguimiento" value={formatDate(c.follow_up_date)} />
              )}
            </div>

            {/* Pie */}
            <div className="mt-auto border-t-2 border-[#DDE3E1] px-14 py-6 text-[24px] text-[#667085]">
              {[s(settings?.phone), s(settings?.address)].filter(Boolean).join(' · ')}
              {s(settings?.note_footer) ? ` — ${s(settings?.note_footer)}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-content-muted">
        <ImageIcon className="h-3.5 w-3.5" /> No incluye datos del tutor.
        <button onClick={download} className="ml-auto flex items-center gap-1 text-primary">
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Regenerar
        </button>
      </div>
    </div>
  )
}

function Section({ title, value, strong }: { title: string; value: string; strong?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p className="mb-1 text-[26px] font-bold uppercase tracking-wide text-[#2F6F64]">{title}</p>
      <p className={strong ? 'font-semibold' : undefined}>{value}</p>
    </div>
  )
}
