import { Link, useNavigate } from 'react-router-dom'
import { FileText, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { SkeletonList, EmptyState, ErrorState } from '@/components/feedback/States'
import { useTemplates } from '@/features/consultations/hooks'

export function TemplatesPage() {
  const templates = useTemplates()
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Plantillas"
        description="Se aplican al iniciar una consulta y precargan contenido totalmente editable."
        actions={
          <Button size="sm" onClick={() => navigate('/templates/new')}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} /> Nueva
          </Button>
        }
      />

      {templates.isLoading && <SkeletonList />}
      {templates.isError && (
        <ErrorState message={(templates.error as Error).message} onRetry={templates.refetch} />
      )}
      {templates.data && templates.data.results.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Sin plantillas"
          description="Crea plantillas para los motivos que más atiendes y ahorra escritura en cada consulta."
          action={
            <Button onClick={() => navigate('/templates/new')}>
              <Plus className="h-4 w-4" strokeWidth={2.25} /> Crear plantilla
            </Button>
          }
        />
      )}

      {templates.data && templates.data.results.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {templates.data.results.map((t) => (
            <li key={t.template_id}>
              <Link to={`/templates/${t.template_id}/edit`} className="row group">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary"
                  aria-hidden
                >
                  <FileText className="h-4 w-4" strokeWidth={1.9} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content-strong">{t.name}</p>
                  <p className="mt-0.5 truncate text-xs text-content-subtle">
                    {[t.category, t.species].filter(Boolean).join(' · ') || 'General'}
                  </p>
                </div>
                <Pencil
                  className="h-3.5 w-3.5 shrink-0 text-content-subtle opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  strokeWidth={1.9}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
