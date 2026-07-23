/**
 * Configuración del backend guardada EN EL NAVEGADOR (localStorage).
 *
 * Motivo: las variables `VITE_*` se "hornean" al compilar. Si el build de
 * GitHub Pages no recibió `VITE_API_URL`, la app se despliega mostrando
 * "Backend sin configurar" y había que recompilar cada vez. Con esta capa el
 * usuario configura la URL y el token UNA VEZ desde la propia app (pantalla
 * Configuración) y queda persistido en su dispositivo: sobrevive a nuevos
 * despliegues sin tocar secretos ni recompilar.
 *
 * Precedencia: lo guardado aquí SIEMPRE gana sobre las variables de build.
 */

const KEY = 'vetnote.backend.v1'

export interface BackendConfig {
  apiUrl: string
  appToken: string
}

function read(): Partial<BackendConfig> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<BackendConfig>
    return {
      apiUrl: typeof parsed.apiUrl === 'string' ? parsed.apiUrl.trim() : undefined,
      appToken: typeof parsed.appToken === 'string' ? parsed.appToken.trim() : undefined,
    }
  } catch {
    return {}
  }
}

/** URL del Web App configurada en el dispositivo (o vacío si no hay). */
export function getRuntimeApiUrl(): string {
  return read().apiUrl ?? ''
}

/** Token de aplicación configurado en el dispositivo (o vacío si no hay). */
export function getRuntimeAppToken(): string {
  return read().appToken ?? ''
}

/** Guarda la configuración del backend en el dispositivo. */
export function setRuntimeConfig(config: BackendConfig): void {
  const clean: BackendConfig = {
    apiUrl: config.apiUrl.trim(),
    appToken: config.appToken.trim(),
  }
  localStorage.setItem(KEY, JSON.stringify(clean))
}

/** Borra la configuración guardada (vuelve a usar las variables de build). */
export function clearRuntimeConfig(): void {
  localStorage.removeItem(KEY)
}
