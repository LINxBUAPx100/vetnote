/**
 * Code.gs — Punto de entrada del Web App VetNote.
 *
 * Flujo: doPost -> parse -> verifica token -> rate limit -> (lock si escribe)
 *        -> Router.dispatch -> respuesta estandarizada.
 *
 * IMPORTANTE (CORS): el cliente envía text/plain para evitar preflight OPTIONS.
 * No se usan headers personalizados; el token viaja en el cuerpo.
 */

function doPost(e) {
  var requestId = uuid_()
  var action = ''
  try {
    var body = parseRequestBody_(e)
    action = body.action
    var payload = body.payload || {}
    var meta = body.meta || {}
    var ctx = { requestId: requestId, userId: '' }

    if (!action) throw errorObj_('VALIDATION_ERROR', 'Falta el campo "action".')

    AuthService.verifyToken(body.token)
    AuthService.checkRateLimit(meta.clientRequestId || '')

    var data
    if (Router.isWrite(action)) {
      var lock = LockService.getScriptLock()
      lock.waitLock(CONFIG.LOCK_TIMEOUT_MS)
      try {
        data = Router.dispatch(action, payload, ctx, meta)
      } finally {
        lock.releaseLock()
      }
    } else {
      data = Router.dispatch(action, payload, ctx, meta)
    }

    return successResponse_(data, messageFor_(action), requestId)
  } catch (err) {
    return handleError_(err, requestId, action)
  }
}

/** doGet: solo para healthCheck y una página informativa. */
function doGet(e) {
  var requestId = uuid_()
  var action = e && e.parameter ? e.parameter.action : ''
  if (action === 'healthCheck') {
    try {
      return successResponse_(healthCheck_(), 'OK', requestId)
    } catch (err) {
      return handleError_(err, requestId, action)
    }
  }
  return ContentService.createTextOutput(
    'VetNote API activa. Usa POST con {action, token, payload}. Ver docs/03-api-contrato.md.',
  ).setMimeType(ContentService.MimeType.TEXT)
}

/** Convierte errores (objeto interno o excepción) en respuesta estandarizada. */
function handleError_(err, requestId, action) {
  var code = 'INTERNAL_ERROR'
  var message = 'Ocurrió un error inesperado.'
  var extra = null

  if (err && err.__vetnoteError) {
    code = err.code
    message = err.message
    if (err.serverRecord) extra = { serverRecord: err.serverRecord }
  } else if (err && err.message) {
    // Errores de cuota de Apps Script suelen mencionar "limit"/"quota".
    if (/quota|limit|exceeded/i.test(err.message)) {
      code = 'QUOTA_LIMIT'
      message = 'Se alcanzó un límite temporal del servidor. Intenta más tarde.'
    } else {
      message = err.message
    }
  }

  AuditService.log({
    action: action, entityType: 'system', entityId: '',
    summary: 'Error en acción', requestId: requestId, success: false, errorMessage: message,
  })
  return errorResponse_(code, message, requestId, extra)
}

function messageFor_(action) {
  var map = {
    createPatient: 'Paciente creado correctamente',
    updatePatient: 'Paciente actualizado',
    createOwner: 'Tutor creado correctamente',
    updateOwner: 'Tutor actualizado',
    createConsultation: 'Consulta guardada correctamente',
    updateConsultation: 'Consulta actualizada',
    updateSettings: 'Configuración guardada',
  }
  return map[action] || 'Operación exitosa'
}

/** healthCheck: confirma que existen las hojas y devuelve versión de esquema. */
function healthCheck_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheets = {}
  Object.keys(SHEETS).forEach(function (key) {
    sheets[SHEETS[key]] = ss.getSheetByName(SHEETS[key]) !== null
  })
  return {
    status: 'ok',
    schemaVersion: CONFIG.SCHEMA_VERSION,
    sheets: sheets,
    serverTime: nowIso_(),
  }
}

/** exportData: respaldo simple en JSON de las hojas de datos. */
function exportData_(p) {
  var include = (p && p.sheets) || [
    SHEETS.OWNERS, SHEETS.PATIENTS, SHEETS.CONSULTATIONS, SHEETS.TEMPLATES,
  ]
  var out = {}
  include.forEach(function (name) {
    out[name] = SheetRepository.findAll(name).map(cleanRow_)
  })
  AuditService.log({ action: 'exportData', entityType: 'system', summary: 'Exportación de datos' })
  return { exportedAt: nowIso_(), schemaVersion: CONFIG.SCHEMA_VERSION, data: out }
}
