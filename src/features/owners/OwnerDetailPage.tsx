import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, User, Pencil, Phone, MessageCircle, PawPrint, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton, ErrorState, EmptyState } from '@/components/feedback/States'
import { ownerService } from '@/services/ownerService'
import { patientService } from '@/services/patientService'
import { phoneDigits } from '@/utils/format'

/** Vista de un tutor: datos de contacto + sus mascotas. */
export function OwnerDetailPage() {
  const { ownerId } = useParams()
  const navigate = useNavigate()
  const owner = useQuery({
    queryKey: ['owner', ownerId],
    queryFn: () => ownerService.get(ownerId!),
    enabled: Boolean(ownerId),
  })
  const pets = useQuery({
    queryKey: ['owner', ownerId, 'pets'],
    queryFn: () => patientService.listByOwner(ownerId!),
    enabled: Boolean(ownerId),
  })

  if (owner.isLoading) return <Skeleton className="mt-6 h-40" />
  if (owner.isError) return <ErrorState message={(owner.error as Error).message} onRetry={owner.refetch} />
  if (!owner.data) return null

  const o = owner.data
  const phone = phoneDigits(o.phone)

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate('/owners')} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Tutor</h1>
      </header>

      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <User className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-lg font-bold">{o.full_name}</h2>
            {o.phone && (
              <p className="flex items-center gap-1 text-sm text-content-muted">
                <Phone className="h-3.5 w-3.5" /> {o.phone}
                {o.secondary_phone ? ` · ${o.secondary_phone}` : ''}
              </p>
            )}
            {o.email && (
              <p className="flex items-center gap-1 text-sm text-content-muted">
                <Mail className="h-3.5 w-3.5" /> {o.email}
              </p>
            )}
            {o.address && (
              <p className="flex items-center gap-1 text-sm text-content-muted">
                <MapPin className="h-3.5 w-3.5" /> {o.address}
              </p>
            )}
          </div>
        </div>
        {o.notes && (
          <p className="mt-3 rounded-lg bg-background p-2 text-sm text-content-muted">{o.notes}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={() => navigate(`/owners/${o.owner_id}/edit`)}>
          <Pencil className="h-4 w-4" /> Editar
        </Button>
        {phone && (
          <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="btn-ghost">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-content-muted">Mascotas</h2>
        {pets.isLoading && <Skeleton className="h-16" />}
        {pets.data && pets.data.results.length === 0 && (
          <EmptyState icon={PawPrint} title="Sin mascotas registradas" />
        )}
        <ul className="space-y-2">
          {pets.data?.results.map((p) => (
            <li key={p.patient_id}>
              <Link
                to={`/patients/${p.patient_id}`}
                className="card flex items-center gap-3 p-3 transition-colors hover:bg-background"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <PawPrint className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-sm text-content-muted">
                    {[p.species, p.breed].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
