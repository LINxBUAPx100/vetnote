import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, User, Phone } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { Skeleton, EmptyState, ErrorState } from '@/components/feedback/States'
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
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Tutores</h1>

      <label className="flex min-h-touch items-center gap-2 rounded-xl border border-border bg-surface px-3">
        <Search className="h-5 w-5 text-content-muted" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o teléfono…"
          aria-label="Buscar tutores"
          className="border-0 bg-transparent px-0 focus:ring-0"
        />
      </label>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}
      {error && <ErrorState message={(error as Error).message} onRetry={() => (isSearching ? search.refetch() : list.refetch())} />}
      {!loading && items && items.length === 0 && (
        <EmptyState
          icon={User}
          title={isSearching ? 'Sin coincidencias' : 'Aún no hay tutores'}
          description="Los tutores se crean al registrar un paciente."
        />
      )}

      <ul className="space-y-2">
        {items?.map((o) => (
          <li key={o.owner_id}>
            <Link
              to={`/owners/${o.owner_id}`}
              className="card flex items-center gap-3 p-3 transition-colors hover:bg-background"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{o.full_name}</p>
                {o.phone && (
                  <p className="flex items-center gap-1 truncate text-sm text-content-muted">
                    <Phone className="h-3.5 w-3.5" /> {normalizePhoneDisplay(o.phone)}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
