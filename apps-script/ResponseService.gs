/**
 * ResponseService.gs — Estandariza TODAS las respuestas JSON.
 * Formato de éxito y error definido en docs/03-api-contrato.md.
 */

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function successResponse_(data, message, requestId) {
  return jsonOutput_({
    success: true,
    data: data === undefined ? null : data,
    message: message || 'Operación exitosa',
    requestId: requestId,
  })
}

function errorResponse_(code, message, requestId, extra) {
  var body = {
    success: false,
    data: null,
    message: message || 'Ocurrió un error',
    errorCode: code || 'INTERNAL_ERROR',
    requestId: requestId,
  }
  if (extra) {
    for (var k in extra) body[k] = extra[k]
  }
  return jsonOutput_(body)
}
