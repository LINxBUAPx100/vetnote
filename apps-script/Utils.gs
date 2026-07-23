/**
 * Utils.gs — Utilidades puras y helpers de bajo nivel.
 * La lógica pura se mantiene separada para poder probarla fácilmente.
 */

function uuid_() {
  return Utilities.getUuid()
}

function nowIso_() {
  return new Date().toISOString()
}

/** Sanitiza texto: recorta, limita longitud y elimina caracteres de control. */
function sanitizeText_(value, maxLen) {
  if (value === null || value === undefined) return ''
  var s = String(value)
  // Elimina caracteres de control salvo salto de linea (\n) y tabulador (\t).
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  s = s.trim()
  var limit = maxLen || CONFIG.MAX_TEXT_LEN
  if (s.length > limit) s = s.substring(0, limit)
  return s
}

/** Sanitiza un telefono: conserva digitos, +, espacios, guiones y parentesis. */
function sanitizePhone_(value, maxLen) {
  if (value === null || value === undefined) return ''
  var s = String(value).replace(/[^0-9+()\-\s]/g, '').trim()
  var limit = maxLen || 40
  return s.length > limit ? s.substring(0, limit) : s
}

/** Parsea a numero o devuelve '' si no es valido. */
function toNumberOrEmpty_(value) {
  if (value === null || value === undefined || value === '') return ''
  var n = Number(value)
  return isNaN(n) ? '' : n
}

/** Parsea el cuerpo (text/plain con JSON) de una peticion doPost. */
function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw errorObj_('VALIDATION_ERROR', 'Peticion vacia o sin cuerpo.')
  }
  try {
    return JSON.parse(e.postData.contents)
  } catch (err) {
    throw errorObj_('VALIDATION_ERROR', 'El cuerpo de la peticion no es JSON valido.')
  }
}

/** Construye un objeto de error interno con codigo estable. */
function errorObj_(code, message, extra) {
  var o = { __vetnoteError: true, code: code, message: message }
  if (extra) {
    for (var k in extra) o[k] = extra[k]
  }
  return o
}

/** Aplica un valor por defecto si el campo viene vacio. */
function defaultIfEmpty_(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : value
}

/** Devuelve una copia del registro sin el campo interno __rowIndex. */
function cleanRow_(row) {
  if (!row) return row
  var out = {}
  for (var k in row) {
    if (k !== '__rowIndex') out[k] = row[k]
  }
  return out
}

/**
 * Control de concurrencia optimista: si el cliente envio expectedUpdatedAt y el
 * registro fue modificado despues, se lanza CONFLICT con la version del servidor.
 */
function assertNoConflict_(currentRecord, meta) {
  if (!meta || !meta.expectedUpdatedAt) return
  var serverUpdated = String(currentRecord.updated_at || '')
  if (serverUpdated && serverUpdated !== String(meta.expectedUpdatedAt)) {
    throw errorObj_('CONFLICT', 'El registro fue modificado desde otro dispositivo.', {
      serverRecord: cleanRow_(currentRecord),
    })
  }
}
