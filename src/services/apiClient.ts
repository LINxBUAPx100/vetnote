import { env } from '@/config/env'
import {
  ApiClientError,
  type ApiAction,
  type ApiRequest,
  type ApiResponse,
} from '@/types/api'

/**
 * Cliente único hacia el Web App de Apps Script.
 *
 * Detalle clave (CORS): Apps Script no maneja bien las peticiones "preflight"
 * (OPTIONS) que dispara un POST con Content-Type: application/json. Para
 * evitarlo enviamos el cuerpo como text/plain; el servidor parsea el JSON.
 * El token viaja DENTRO del cuerpo, nunca en headers personalizados.
 */

interface CallOptions {
  /** updated_at conocido, para control de concurrencia optimista. */
  expectedUpdatedAt?: string
  /** id de idempotencia generado por el cliente (cola de sync). */
  clientRequestId?: string
  /** Aborta la petición (debounce/timeout). */
  signal?: AbortSignal
}

const DEFAULT_TIMEOUT_MS = 20_000

function makeClientRequestId(): string {
  // crypto.randomUUID está disponible en navegadores modernos y en el SW.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `cli-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

export async function apiCall<D = unknown, P = unknown>(
  action: ApiAction,
  payload?: P,
  options: CallOptions = {},
): Promise<D> {
  if (!env.isConfigured) {
    throw new ApiClientError(
      'La aplicación no tiene configurada la URL del backend (VITE_API_URL).',
      'NOT_CONFIGURED',
    )
  }

  const body: ApiRequest<P> = {
    action,
    token: env.appToken,
    payload,
    meta: {
      clientRequestId: options.clientRequestId ?? makeClientRequestId(),
      expectedUpdatedAt: options.expectedUpdatedAt,
    },
  }

  // Timeout propio combinado con la señal externa (si la hay).
  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), DEFAULT_TIMEOUT_MS)
  const signal = options.signal
    ? anySignal([options.signal, timeoutController.signal])
    : timeoutController.signal

  let raw: Response
  try {
    raw = await fetch(env.apiUrl, {
      method: 'POST',
      // text/plain evita el preflight OPTIONS que Apps Script no responde.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new ApiClientError('La petición se canceló o expiró.', 'NETWORK_ERROR')
    }
    throw new ApiClientError(
      'No se pudo conectar con Google Sheets. Se reintentará más tarde.',
      'NETWORK_ERROR',
    )
  } finally {
    clearTimeout(timeout)
  }

  let parsed: ApiResponse<D>
  try {
    parsed = (await raw.json()) as ApiResponse<D>
  } catch {
    throw new ApiClientError(
      'El servidor devolvió una respuesta no válida.',
      'BAD_RESPONSE',
    )
  }

  if (parsed.success) {
    return parsed.data
  }

  throw new ApiClientError(
    parsed.message,
    parsed.errorCode,
    parsed.requestId,
    parsed.serverRecord,
  )
}

/** Combina varias AbortSignal en una sola (para timeout + señal externa). */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const s of signals) {
    if (s.aborted) {
      controller.abort()
      break
    }
    s.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}
