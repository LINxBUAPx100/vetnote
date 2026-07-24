import { useLayoutEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, IdCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/uiStore'
import { formatDate } from '@/utils/format'
import type { CarnetEntry, Patient, Owner, ClinicSettings } from '@/types/domain'

const ACCENT = '#3A8FE0'
const ACCENT_SOFT = '#E7F1FC'
const INK = '#122740'
const MUTED = '#5A7189'
const WIDTH = 1080
const PREVIEW_W = 320

const CATEGORY_LABEL: Record<string, string> = {
  vacuna: 'Vacuna',
  desparasitacion: 'Desparasitación',
  otro: 'Otro',
}

interface Props {
  entries: CarnetEntry[]
  patient?: Pick<Patient, 'name' | 'species' | 'breed' | 'approximate_age'> | null
  owner?: Pick<Owner, 'full_name'> | null
  settings?: ClinicSettings | null
}

function s(v?: string | number | null): string {
  return v === null || v === undefined ? '' : String(v).trim()
}

/**
 * Imagen del carnet sanitario, tamaño ancho fijo y ALTO AUTOMÁTICO: crece con el
 * contenido para que nunca se corte nada.
 */
export function CarnetCard({ entries, patient, owner, settings }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)
  const [cardHeight, setCardHeight] = useState(0)
  const accent = s(settings?.primary_color) || ACCENT
  const scale = PREVIEW_W / WIDTH

  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.scrollHeight)
  }, [entries, patient, owner, settings])

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
      link.download = `carnet-${s(patient?.name) || 'mascota'}.png`.replace(/\s+/g, '_')
      link.href = dataUrl
      link.click()
      toast.success('Carnet generado')
    } catch {
      toast.error('No se pudo generar el carnet')
    } finally {
      setGenerating(false)
    }
  }

  const meta = [s(patient?.species), s(patient?.breed), s(patient?.approximate_age)]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-3">
      <Button onClick={download} loading={generating} className="w-full">
        <Download className="h-4 w-4" /> Descargar carnet (PNG)
      </Button>

      <div
        className="mx-auto overflow-hidden rounded-xl border border-border shadow-card"
        style={{ width: PREVIEW_W, height: cardHeight ? cardHeight * scale : undefined }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: WIDTH }}>
          <div ref={cardRef} style={{ width: WIDTH, color: INK }} className="bg-white font-sans">
            {/* Encabezado */}
            <div style={{ background: accent }} className="px-14 py-10 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-4xl">
                  🐾
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[40px] font-extrabold leading-tight">
                    {s(settings?.clinic_name) || 'VetNote'}
                  </p>
                  <p className="text-[24px] text-white/85">Carnet sanitario</p>
                </div>
              </div>
            </div>

            {/* Datos del paciente */}
            <div className="mx-14 -mt-6 rounded-2xl bg-white px-8 py-6 shadow-[0_10px_30px_rgba(24,71,122,0.14)]">
              <p className="text-[46px] font-bold leading-tight">{s(patient?.name) || 'Mascota'}</p>
              {meta && (
                <p className="text-[24px]" style={{ color: MUTED }}>
                  {meta}
                </p>
              )}
              {s(owner?.full_name) && (
                <p className="mt-1 text-[22px]" style={{ color: accent }}>
                  Tutor: {s(owner?.full_name)}
                </p>
              )}
            </div>

            {/* Tabla de entradas */}
            <div className="px-14 pb-4 pt-8">
              {entries.length === 0 ? (
                <p className="text-[26px]" style={{ color: MUTED }}>
                  Sin registros en el carnet.
                </p>
              ) : (
                <div className="space-y-3">
                  {entries.map((e) => (
                    <div
                      key={e.entry_id}
                      className="rounded-2xl px-6 py-5"
                      style={{ background: ACCENT_SOFT }}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="text-[30px] font-bold">{s(e.product)}</p>
                        <p className="text-[22px]" style={{ color: MUTED }}>
                          {formatDate(e.application_date)}
                        </p>
                      </div>
                      <p className="text-[22px]" style={{ color: accent }}>
                        {CATEGORY_LABEL[e.category] ?? 'Otro'}
                        {s(e.lot) ? ` · Lote ${s(e.lot)}` : ''}
                        {s(e.manufacturer) ? ` · ${s(e.manufacturer)}` : ''}
                      </p>
                      {s(e.next_due_date) && (
                        <p className="text-[22px] font-semibold" style={{ color: INK }}>
                          Próxima dosis: {formatDate(e.next_due_date)}
                        </p>
                      )}
                      {s(e.notes) && (
                        <p className="text-[22px]" style={{ color: MUTED }}>
                          {s(e.notes)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie */}
            <div
              className="px-14 py-7 text-[22px]"
              style={{ borderTop: `3px solid ${ACCENT_SOFT}`, color: MUTED }}
            >
              {[s(settings?.vet_name), s(settings?.professional_id) && `Cédula ${s(settings?.professional_id)}`, s(settings?.phone), s(settings?.address)]
                .filter(Boolean)
                .join('  ·  ')}
            </div>
          </div>
        </div>
      </div>

      <p className="flex items-center gap-1 text-xs text-content-muted">
        <IdCard className="h-3.5 w-3.5" /> El alto de la imagen se ajusta al contenido.
      </p>
    </div>
  )
}
