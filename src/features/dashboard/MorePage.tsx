import { Link } from 'react-router-dom'
import {
  Users,
  FileText,
  Pill,
  Settings,
  ChevronRight,
  Stethoscope,
  IdCard,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

interface Item {
  to: string
  label: string
  icon: LucideIcon
  desc: string
}

const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: 'Expedientes',
    items: [
      { to: '/consultations', label: 'Consultas', icon: Stethoscope, desc: 'Historial de consultas' },
      { to: '/carnet', label: 'Carnet sanitario', icon: IdCard, desc: 'Vacunas y desparasitaciones' },
      { to: '/owners', label: 'Tutores', icon: Users, desc: 'Directorio y datos de contacto' },
    ],
  },
  {
    label: 'Catálogos',
    items: [
      { to: '/templates', label: 'Plantillas', icon: FileText, desc: 'Plantillas de consulta' },
      { to: '/medications', label: 'Medicamentos', icon: Pill, desc: 'Catálogo de medicamentos' },
      { to: '/settings', label: 'Configuración', icon: Settings, desc: 'Datos de la clínica' },
    ],
  },
]

/** Menú "Más" para navegación móvil (secciones que no caben en la barra inferior). */
export function MorePage() {
  return (
    <div>
      <PageHeader title="Más" />

      <div className="space-y-7">
        {GROUPS.map((group) => (
          <section key={group.label}>
            <h2 className="eyebrow mb-2">{group.label}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {group.items.map(({ to, label, icon: Icon, desc }) => (
                <li key={to}>
                  <Link to={to} className="row">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.9} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-content-strong">{label}</p>
                      <p className="mt-0.5 truncate text-xs text-content-subtle">{desc}</p>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-content-subtle"
                      strokeWidth={1.9}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
