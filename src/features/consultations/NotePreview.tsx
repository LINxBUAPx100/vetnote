import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/uiStore'

/** Muestra la nota de WhatsApp con botón de copiar (un toque). */
export function NotePreview({ note }: { note: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(note)
      setCopied(true)
      toast.success('Nota copiada')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar. Copia manualmente.')
    }
  }

  return (
    <div className="space-y-2">
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 font-sans text-sm leading-relaxed">
        {note}
      </pre>
      <Button onClick={copy} className="w-full">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copiado' : 'Copiar nota'}
      </Button>
    </div>
  )
}
