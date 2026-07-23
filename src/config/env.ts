/**
 * Configuración pública de la aplicación.
 *
 * Combina dos fuentes, en orden de precedencia:
 *   1. Configuración guardada en el dispositivo (localStorage) desde la pantalla
 *      Configuración → sección "Servidor". Ver runtimeConfig.ts.
 *   2. Variables de entorno Vite (`VITE_*`) horneadas al compilar.
 *
 * Gracias a (1), el usuario configura el backend una sola vez desde la app
 * desplegada sin recompilar. Ninguna credencial privada debe vivir aquí
 * (ver docs/01-arquitectura.md).
 */
import { getRuntimeApiUrl, getRuntimeAppToken } from './runtimeConfig'

const BUILD_API_URL = import.meta.env.VITE_API_URL ?? ''
const BUILD_APP_TOKEN = import.meta.env.VITE_APP_TOKEN ?? ''
const BASE_PATH = import.meta.env.VITE_BASE_PATH ?? '/'

/**
 * Objeto con *getters*: cada acceso relee la configuración del dispositivo,
 * de modo que al guardar en Configuración el cambio surte efecto sin recargar.
 */
export const env = {
  get apiUrl(): string {
    return getRuntimeApiUrl() || BUILD_API_URL
  },
  get appToken(): string {
    return getRuntimeAppToken() || BUILD_APP_TOKEN
  },
  get basePath(): string {
    return BASE_PATH
  },
  // El backend ahora es Firebase (config incrustada en src/config/firebase.ts),
  // así que la app siempre está configurada.
  get isConfigured(): boolean {
    return true
  },
} as const

export type AppEnv = typeof env
