/**
 * AuditService.gs — Registro de acciones en la hoja AuditLog.
 * NO guarda información clínica completa; solo metadatos de la operación.
 */

var AuditService = (function () {
  function log_(entry) {
    try {
      SheetRepository.insert(SHEETS.AUDIT, {
        log_id: uuid_(),
        timestamp: nowIso_(),
        user_id: entry.userId || '',
        action: entry.action || '',
        entity_type: entry.entityType || '',
        entity_id: entry.entityId || '',
        summary: sanitizeText_(entry.summary || '', 200),
        request_id: entry.requestId || '',
        success: entry.success === false ? 'false' : 'true',
        error_message: sanitizeText_(entry.errorMessage || '', 300),
      })
    } catch (err) {
      // La auditoría nunca debe romper la operación principal.
    }
  }

  return { log: log_ }
})()
