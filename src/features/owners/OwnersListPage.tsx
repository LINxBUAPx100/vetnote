import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { User, ChevronRight } from 'lucide-react'
import { SearchInput } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'
import { SkeletonList, EmptyState, ErrorState } from '@/components/feedback/States'
import { useDebounced } from '@/hooks/useDebounced'
import { ownerService } from '@/services/ownerService'
import { normalizePhoneDisplay } from '@/utils/format'

export function OwnersListPage() {
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const isSearching = debounced.trim().length >= 2

  const search = useQuery({
    queryKey: ['owners', 'search', debounced],
    queryFn: () => ownerService.search(debounced, 50),
    enabled: isSearching,
  })
  const list = useQuery({ queryKey: ['owners', 'list'], queryFn: () => ownerService.list() })

  const items = isSearching ? search.data?.results : list.data?.results
  const loading = isSearching ? search.isLoading : list.isLoading
  const error = isSearching ? search.error : list.error

  return (
    <div>
      <PageHeader
        title="Tutores"
        description="Directorio de tutores y sus datos de contacto."
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        label="Buscar tutores"
        placeholder="Nombre o teléfono…"
      />

      <div className="mt-4">
        {loading && <SkeletonList />}
        {error && (
          <ErrorState
            message={(error as Error).message}
            onRetry={() => (isSearching ? search.refetch() : list.refetch())}
          />
        )}
        {!loading && !error && items && items.length === 0 && (
          <EmptyState
            icon={User}
            title={isSearching ? `Sin coincidencias para “${debounced}”` : 'Aún no hay tutores'}
            description="Los tutores se crean al registrar un paciente, o desde el propio expediente."
          />
        )}

        {!loading && items && items.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {items.map((o) => (
              <li key={o.owner_id}>
                <Link to={`/owners/${o.owner_id}`} className="row">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent"
                    aria-hidden
                  >
                    <User className="h-4 w-4" strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content-strong">
                      {o.full_name}
                    </p>
                    {o.phone && (
                      <p className="tabular mt-0.5 truncate text-xs text-content-subtle">
                        {normalizePhoneDisplay(o.phone)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-content-subtle" strokeWidth={1.9} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
