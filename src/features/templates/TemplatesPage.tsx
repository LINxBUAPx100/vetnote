import { Link, useNavigate } from 'react-router-dom'
import { FileText, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, EmptyState, ErrorState } from '@/components/feedback/States'
import { useTemplates } from '@/features/consultations/hooks'

export function TemplatesPage() {
  const templates = useTemplates()
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Plantillas</h1>
        <Button className="px-3" onClick={() => navigate('/templates/new')}>
          <Plus className="h-4 w-4" /> Nueva
        </Button>
      </header>
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
        <EmptyState
          icon={FileText}
          title="Sin plantillas"
          description="Crea tu primera plantilla con el botón Nueva."
        />
      )}

      <ul className="space-y-2">
        {templates.data?.results.map((t) => (
          <li key={t.template_id}>
            <Link
              to={`/templates/${t.template_id}/edit`}
              className="card flex items-center gap-3 p-3 transition-colors hover:bg-background"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.name}</p>
                <p className="truncate text-sm text-content-muted">
                  {[t.category, t.species].filter(Boolean).join(' · ') || 'General'}
                </p>
              </div>
              <Pencil className="h-4 w-4 text-content-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
