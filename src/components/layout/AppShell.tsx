import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Home,
  PawPrint,
  Plus,
  Stethoscope,
  Menu,
  Users,
  FileText,
  Pill,
  Settings,
  CalendarClock,
  IdCard,
} from 'lucide-react'
import { cn } from '@/lib/cn'

const desktopNav = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/patients', label: 'Pacientes', icon: PawPrint },
  { to: '/agenda', label: 'Agenda', icon: CalendarClock },
  { to: '/consultations', label: 'Consultas', icon: Stethoscope },
  { to: '/carnet', label: 'Carnet', icon: IdCard },
  { to: '/owners', label: 'Tutores', icon: Users },
  { to: '/templates', label: 'Plantillas', icon: FileText },
  { to: '/medications', label: 'Medicamentos', icon: Pill },
  { to: '/settings', label: 'Configuración', icon: Settings },
]

/** Estructura responsive: sidebar en escritorio, barra inferior en móvil. */
export function AppShell() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      {/* Sidebar (escritorio) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_4px_12px_rgba(58,143,224,0.35)]">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">VetNote</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {desktopNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-touch items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-content-muted hover:bg-background hover:text-content',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Contenido */}
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
          <Outlet />
        </main>
      </div>

      {/* Barra inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-surface md:hidden">
        <BottomLink to="/" label="Inicio" icon={Home} end />
        <BottomLink to="/patients" label="Pacientes" icon={PawPrint} />
        <button
          type="button"
          onClick={() => navigate('/consultations/new')}
          className="flex flex-col items-center justify-center gap-0.5 py-2"
          aria-label="Nueva consulta"
        >
          <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-floating">
            <Plus className="h-7 w-7" />
          </span>
        </button>
        <BottomLink to="/agenda" label="Agenda" icon={CalendarClock} />
        <BottomLink to="/more" label="Más" icon={Menu} />
      </nav>
    </div>
  )
}

function BottomLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-h-touch flex-col items-center justify-center gap-0.5 py-2 text-xs',
          isActive ? 'text-primary' : 'text-content-muted',
        )
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  )
}
