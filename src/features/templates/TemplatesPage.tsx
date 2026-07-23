import { FileText } from 'lucide-react'
import { Skeleton, EmptyState, ErrorState } from '@/components/feedback/States'
import { useTemplates } from '@/features/consultations/hooks'

export function TemplatesPage() {
  const templates = useTemplates()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Plantillas</h1>
      <p className="text-sm text-content-muted">
        Se aplican al iniciar una consulta. Precargan contenido totalmente editable.
      </p>

      {templates.isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}
      {templates.isError && (
        <ErrorState message={(templates.error as Error).message} onRetry={templates.refetch} />
      )}
      {templates.data && templates.data.results.length === 0 && (
        <EmptyState icon={FileText} title="Sin plantillas" description="Se siembran al inicializar la base." />
      )}

      <ul className="space-y-2">
        {templates.data?.results.map((t) => (
          <li key={t.template_id} className="card p-3">
            <p className="font-medium">{t.name}</p>
            <p className="text-sm text-content-muted">
              {[t.category, t.species].filter(Boolean).join(' · ') || 'General'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
