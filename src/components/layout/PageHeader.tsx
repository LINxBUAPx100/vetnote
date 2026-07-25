import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  /** Línea superior discreta (contexto: nombre del paciente, sección…). */
  eyebrow?: string
  description?: string
  /** Acción principal alineada a la derecha. */
  actions?: ReactNode
  /** Muestra la flecha de volver. `true` usa history.back. */
  back?: boolean | string
}

/**
 * Encabezado consistente: título con peso y tracking ajustados, contexto en
 * gris suave y acciones a la derecha (nunca centrado).
 */
export function PageHeader({ title, eyebrow, description, actions, back }: Props) {
  const navigate = useNavigate()

  return (
    <header className="mb-6 flex items-start gap-3">
      {back && (
        <button
          type="button"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          aria-label="Volver"
          className="-ml-1.5 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-content-muted transition-all duration-200 hover:bg-sunken hover:text-content-strong"
        >
          <ArrowLeft className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
      )}

      <div className="min-w-0 flex-1">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-content-strong">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-content-muted">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2 pt-0.5">{actions}</div>}
    </header>
  )
}

/** Título de sección dentro de una página (con acción opcional a la derecha). */
export function SectionHeader({
  title,
  count,
  action,
}: {
  title: string
  count?: number
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="flex items-baseline gap-2 text-sm font-semibold text-content-strong">
        {title}
        {count !== undefined && count > 0 && (
          <span className="text-xs font-medium tabular text-content-subtle">{count}</span>
        )}
      </h2>
      {action}
    </div>
  )
}
