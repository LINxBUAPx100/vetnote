import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * `lazy()` endurecido contra el error "Failed to fetch dynamically imported
 * module". Ese error ocurre cuando el navegador tiene cacheado un index/SW
 * viejo que apunta a un chunk cuyo hash ya cambió tras un despliegue nuevo
 * (o, en desarrollo, tras reiniciar Vite). El módulo simplemente ya no existe
 * en el servidor y la importación revienta.
 *
 * Estrategia:
 *  - Reintenta la importación una vez (cubre fallos de red transitorios).
 *  - Si sigue fallando por un chunk desaparecido, fuerza UNA recarga completa
 *    de la página (con guarda en sessionStorage para no entrar en bucle). Al
 *    recargar se descarga el index nuevo con los hashes correctos.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  key: string,
): LazyExoticComponent<T> {
  const flag = `vetnote.chunk-reload.${key}`

  return lazy(async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem(flag)
      return mod
    } catch (err) {
      // Segundo intento inmediato: cubre parpadeos de red.
      try {
        const mod = await factory()
        sessionStorage.removeItem(flag)
        return mod
      } catch (err2) {
        const alreadyReloaded = sessionStorage.getItem(flag) === '1'
        if (!alreadyReloaded) {
          sessionStorage.setItem(flag, '1')
          window.location.reload()
          // Devuelve una promesa que nunca resuelve: la página se está recargando.
          return new Promise<{ default: T }>(() => {})
        }
        // Ya recargamos una vez y sigue fallando: propaga para el errorElement.
        throw err2 ?? err
      }
    }
  })
}
