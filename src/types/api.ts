/**
 * Contrato de API entre el frontend y el Web App de Apps Script.
 * Debe mantenerse en sincronía con apps-script/ResponseService.gs y Router.gs.
 * Ver docs/03-api-contrato.md.
 */

/** Todas las acciones expuestas por el backend. */
export type ApiAction =
  | 'healthCheck'
  | 'createPatient'
  | 'updatePatient'
  | 'getPatient'
  | 'searchPatients'
  | 'listPatients'
  | 'listPatientsByOwner'
  | 'createOwner'
  | 'updateOwner'
  | 'getOwner'
  | 'searchOwners'
  | 'listOwners'
  | 'createConsultation'
  | 'updateConsultation'
  | 'getConsultation'
  | 'getPatientHistory'
  | 'listRecentConsultations'
  | 'createTemplate'
  | 'updateTemplate'
  | 'listTemplates'
  | 'listMedications'
  | 'createMedication'
  | 'updateMedication'
  | 'softDeletePatient'
  | 'softDeleteConsultation'
  | 'getSettings'
  | 'updateSettings'
  | 'exportData'

/** Envoltura de petición enviada como text/plain para evitar preflight CORS. */
export interface ApiRequest<P = unknown> {
  action: ApiAction
  token: string
  payload?: P
  /** Metadatos: requestId del cliente, updated_at para control de concurrencia, etc. */
  meta?: {
    clientRequestId?: string
    expectedUpdatedAt?: string
  }
}

/** Respuesta exitosa estandarizada. */
export interface ApiSuccess<D = unknown> {
  success: true
  data: D
  message: string
  requestId: string
}

/** Códigos de error estables para el manejo diferenciado en el cliente. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_TOKEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'QUOTA_LIMIT'
  | 'DUPLICATE'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ACTION'
  | 'CONSULTATION_CREATE_ERROR'
  | 'PATIENT_CREATE_ERROR'

/** Respuesta de error estandarizada. */
export interface ApiError {
  success: false
  data: null
  message: string
  errorCode: ApiErrorCode
  requestId: string
  /** Presente en CONFLICT: versión más reciente del servidor. */
  serverRecord?: unknown
}

export type ApiResponse<D = unknown> = ApiSuccess<D> | ApiError

/** Error tipado que lanza el apiClient para que la UI lo diferencie. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode | 'NETWORK_ERROR' | 'NOT_CONFIGURED' | 'BAD_RESPONSE',
    public readonly requestId?: string,
    public readonly serverRecord?: unknown,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}
