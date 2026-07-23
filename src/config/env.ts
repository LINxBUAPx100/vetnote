/**
 * Configuración pública de la aplicación, leída de variables de entorno Vite.
 * Ninguna credencial privada debe vivir aquí (ver docs/01-arquitectura.md).
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  appToken: import.meta.env.VITE_APP_TOKEN ?? '',
  basePath: import.meta.env.VITE_BASE_PATH ?? '/',
  isConfigured: Boolean(import.meta.env.VITE_API_URL),
} as const

export type AppEnv = typeof env
