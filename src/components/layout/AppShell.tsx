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
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** Navegación agrupada: el día a día arriba, los catálogos abajo. */
const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { to: '/', label: 'Inicio', icon: Home, end: true },
      { to: '/agenda', label: 'Agenda', icon: CalendarClock },
      { to: '/consultations', label: 'Consultas', icon: Stethoscope },
    ],
  },
  {
    label: 'Expedientes',
    items: [
      { to: '/patients', label: 'Pacientes', icon: PawPrint },
      { to: '/owners', label: 'Tutores', icon: Users },
      { to: '/carnet', label: 'Carnet', icon: IdCard },
    ],
  },
  {
    label: 'Catálogos',
    items: [
      { to: '/templates', label: 'Plantillas', icon: FileText },
      { to: '/medications', label: 'Medicamentos', icon: Pill },
      { to: '/settings', label: 'Configuración', icon: Settings },
    ],
  },
]

/** Estructura responsive: sidebar en escritorio, barra inferior en móvil. */
export function AppShell() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      {/* Sidebar (escritorio) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white"
            aria-hidden
          >
            <Stethoscope className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <span className="text-base font-semibold tracking-tight text-content-strong">
            VetNote
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group, i) => (
            <div key={group.label ?? i} className="flex flex-col gap-0.5">
              {group.label && <p className="eyebrow mb-1.5 px-3">{group.label}</p>}
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-content-muted hover:bg-sunken hover:text-content-strong',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors duration-200',
                          isActive ? 'text-primary' : 'text-content-subtle group-hover:text-content-muted',
                        )}
                        strokeWidth={1.9}
                      />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={() => navigate('/consultations/new')}
            className="btn-primary w-full"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} /> Nueva consulta
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-h-screen flex-col pb-24 md:pb-0">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>

      {/* Barra inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface/95 backdrop-blur-sm md:hidden">
        <BottomLink to="/" label="Inicio" icon={Home} end />
        <BottomLink to="/patients" label="Pacientes" icon={PawPrint} />
        <button
          type="button"
          onClick={() => navigate('/consultations/new')}
          className="flex flex-col items-center justify-center py-2"
          aria-label="Nueva consulta"
        >
          <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-floating transition-transform duration-200 active:scale-95">
            <Plus className="h-6 w-6" strokeWidth={2.25} />
          </span>
        </button>
        <BottomLink to="/agenda" label="Agenda" icon={CalendarClock} />
        <BottomLink to="/more" label="Más" icon={Menu} />
      </nav>
    </div>
  )
}

function BottomLink({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-h-touch flex-col items-center justify-center gap-1 py-2.5 text-2xs font-medium transition-colors duration-200',
          isActive ? 'text-primary' : 'text-content-subtle',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.25 : 1.9} />
          {label}
        </>
      )}
    </NavLink>
  )
}
