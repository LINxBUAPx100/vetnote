/**
 * Configuración pública de la aplicación.
 *
 * El backend es Firebase (config incrustada en `src/config/firebase.ts`), así
 * que la app siempre está configurada. Ninguna credencial privada vive aquí
 * (ver docs/01-arquitectura.md).
 */
const BASE_PATH = import.meta.env.VITE_BASE_PATH ?? '/'

export const env = {
  get basePath(): string {
    return BASE_PATH
  },
  get isConfigured(): boolean {
    return true
  },
} as const

export type AppEnv = typeof env
