import { useEffect } from 'react'
import { queryClient } from './queryClient'
import { env } from '@/config/env'
import { templateService, medicationService, settingsService } from '@/services/catalogService'

/**
 * Precarga en segundo plano de los catálogos de cambio lento (plantillas,
 * medicamentos, configuración). Se dispara con un pequeño retardo para no
 * competir con la carga de la pantalla inicial. Rellena la caché (persistida),
 * así al navegar a esas secciones ya está todo listo, sin esperar a Apps Script.
 */
export function Prefetch() {
  useEffect(() => {
    if (!env.isConfigured) return
    const t = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['templates'],
        queryFn: () => templateService.list(),
        staleTime: 300_000,
      })
      queryClient.prefetchQuery({
        queryKey: ['medications'],
        queryFn: () => medicationService.list(),
        staleTime: 300_000,
      })
      queryClient.prefetchQuery({
        queryKey: ['settings'],
        queryFn: () => settingsService.get(),
        staleTime: 300_000,
      })
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  return null
}
