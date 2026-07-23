import { Link } from 'react-router-dom'
import {
  Users,
  FileText,
  Pill,
  RefreshCw,
  Settings,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'

const items: { to: string; label: string; icon: LucideIcon; desc: string }[] = [
  { to: '/owners', label: 'Tutores', icon: Users, desc: 'Directorio de tutores y sus mascotas' },
  { to: '/templates', label: 'Plantillas', icon: FileText, desc: 'Plantillas de consulta' },
  { to: '/medications', label: 'Medicamentos', icon: Pill, desc: 'Catálogo de medicamentos' },
  { to: '/sync', label: 'Sincronización', icon: RefreshCw, desc: 'Registros pendientes de enviar' },
  { to: '/settings', label: 'Configuración', icon: Settings, desc: 'Datos de la clínica' },
]

/** Menú "Más" para navegación móvil (secciones que no caben en la barra inferior). */
export function MorePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Más</h1>
      <ul className="space-y-2">
        {items.map(({ to, label, icon: Icon, desc }) => (
          <li key={to}>
            <Link
              to={to}
              className="card flex items-center gap-3 p-3 transition-colors hover:bg-background"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{label}</p>
                <p className="truncate text-sm text-content-muted">{desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-content-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
