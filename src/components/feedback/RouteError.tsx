import { useRouteError, useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * Pantalla de recuperación para errores no capturados de una ruta (incluye el
 * fallo "Failed to fetch dynamically imported module"). Sustituye la pantalla
 * de error cruda de React Router por algo entendible y accionable.
 */
export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()
  const message = error instanceof Error ? error.message : String(error ?? 'Error desconocido')
  const isChunk = /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
    message,
  )

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div>
        <h1 className="text-lg font-bold">Algo se interrumpió</h1>
        <p className="mt-1 max-w-sm text-sm text-content-muted">
          {isChunk
            ? 'La app se actualizó y esta parte quedó desincronizada. Recarga para cargar la versión nueva.'
            : message}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" /> Recargar
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')}>
          <Home className="h-4 w-4" /> Ir al inicio
        </Button>
      </div>
    </div>
  )
}
