import { Textarea } from '@/components/ui/Field'
import { QUICK_PHRASES } from './quickPhrases'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  showPhrases?: boolean
}

/** Textarea clínico con chips de frases rápidas que se agregan al contenido. */
export function ClinicalTextarea({ label, value, onChange, placeholder, showPhrases }: Props) {
  const append = (phrase: string) => {
    const sep = value.trim() ? (value.endsWith('\n') ? '' : '\n') : ''
    onChange(value + sep + phrase)
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {showPhrases && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {QUICK_PHRASES.slice(0, 5).map((ph) => (
            <button
              key={ph}
              type="button"
              onClick={() => append(ph)}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-content-muted hover:border-primary hover:text-primary"
            >
              {ph}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
