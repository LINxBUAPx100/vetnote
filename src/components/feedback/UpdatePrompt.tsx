import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * Aviso de nueva versión disponible. registerType='prompt': el usuario decide
 * cuándo actualizar; no se fuerza recarga (evita perder una consulta sin guardar).
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-sm px-4 md:bottom-6">
      <div className="card flex items-center gap-3 p-3 shadow-floating">
        <RefreshCw className="h-5 w-5 text-primary" />
        <p className="flex-1 text-sm font-medium">Hay una actualización disponible.</p>
        <Button className="px-3 py-2 text-sm" onClick={() => updateServiceWorker(true)}>
          Actualizar
        </Button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-sm text-content-muted"
        >
          Luego
        </button>
      </div>
    </div>
  )
}
