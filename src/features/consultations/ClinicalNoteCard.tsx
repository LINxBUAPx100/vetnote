import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/uiStore'
import { formatDate } from '@/utils/format'
import type { Consultation, Patient, ClinicSettings } from '@/types/domain'

type Format = '1080x1350' | '1080x1920'
const DIMENSIONS: Record<Format, { w: number; h: number }> = {
  '1080x1350': { w: 1080, h: 1350 },
  '1080x1920': { w: 1080, h: 1920 },
}

interface Props {
  consultation: Partial<Consultation>
  patient?: Pick<Patient, 'name' | 'species' | 'breed'> | null
  settings?: ClinicSettings | null
}

/** Genera una imagen clínica descargable optimizada para compartir por WhatsApp. */
export function ClinicalNoteCard({ consultation: c, patient, settings }: Props) {
  const [fmt, setFmt] = useState<Format>('1080x1350')
  const [generating, setGenerating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const dim = DIMENSIONS[fmt]

  const download = async () => {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 1,
        width: dim.w,
        height: dim.h,
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.download = `vetnote-${patient?.name ?? 'consulta'}-${formatDate(c.consultation_date, 'yyyyMMdd')}.png`
      link.href = dataUrl
      link.click()
      toast.success('Imagen generada')
    } catch {
      toast.error('No se pudo generar la imagen')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={fmt}
          onChange={(e) => setFmt(e.target.value as Format)}
          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
        >
          <option value="1080x1350">Vertical 4:5 (1080×1350)</option>
          <option value="1080x1920">Story 9:16 (1080×1920)</option>
        </select>
        <Button onClick={download} loading={generating} className="flex-1">
          <Download className="h-4 w-4" /> Descargar PNG
        </Button>
      </div>

      {/* Vista previa escalada. El nodo real se renderiza a tamaño completo. */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div
          className="origin-top-left"
          style={{ transform: `scale(${320 / dim.w})`, width: dim.w, height: dim.h }}
        >
          <div
            ref={cardRef}
            style={{ width: dim.w, height: dim.h }}
            className="flex flex-col bg-white p-16 text-[#1F2933]"
          >
            <header className="flex items-center gap-4 border-b-4 border-[#2F6F64] pb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2F6F64] text-4xl text-white">
                🩺
              </div>
              <div>
                <p className="text-4xl font-bold">{settings?.clinic_name ?? 'VetNote'}</p>
                {settings?.vet_name && <p className="text-2xl text-[#667085]">{settings.vet_name}</p>}
              </div>
            </header>

            <div className="mt-8 flex-1 space-y-6 text-3xl leading-snug">
              <div>
                <p className="text-5xl font-bold">{patient?.name}</p>
                <p className="text-2xl text-[#667085]">
                  {[patient?.species, patient?.breed].filter(Boolean).join(' · ')} ·{' '}
                  {formatDate(c.consultation_date)}
                </p>
              </div>
              {c.reason && <CardBlock title="Motivo" value={c.reason} />}
              {c.presumptive_diagnosis && (
                <CardBlock title="Diagnóstico presuntivo" value={c.presumptive_diagnosis} />
              )}
              {c.treatment && <CardBlock title="Tratamiento" value={c.treatment} />}
              {c.recommendations && <CardBlock title="Recomendaciones" value={c.recommendations} />}
            </div>

            <footer className="border-t-2 border-[#DDE3E1] pt-4 text-2xl text-[#667085]">
              {[settings?.phone, settings?.address].filter(Boolean).join(' · ')}
              {settings?.note_footer ? ` — ${settings.note_footer}` : ''}
            </footer>
          </div>
        </div>
      </div>

      <p className="flex items-center gap-1 text-xs text-content-muted">
        <ImageIcon className="h-3.5 w-3.5" /> No se incluyen datos confidenciales del tutor.
        <button onClick={download} className="ml-auto flex items-center gap-1 text-primary">
          <RefreshCw className="h-3 w-3" /> Regenerar
        </button>
      </p>
    </div>
  )
}

function CardBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-[#2F6F64]">{title}</p>
      <p>{value}</p>
    </div>
  )
}
