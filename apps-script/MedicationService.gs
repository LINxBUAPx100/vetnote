/**
 * MedicationService.gs — Catálogo auxiliar de medicamentos.
 * No realiza recomendaciones automáticas de dosis (juicio clínico humano).
 */

var MedicationService = (function () {
  var FIELDS = [
    'generic_name', 'commercial_name', 'presentation', 'concentration',
    'route', 'default_instructions', 'notes',
  ]

  function list_() {
    var cache = CacheService.getScriptCache()
    var cached = cache.get('medications')
    if (cached) return JSON.parse(cached)
    var rows = SheetRepository.findAll(SHEETS.MEDICATIONS, function (m) {
      return m.status !== 'deleted'
    }).map(cleanRow_)
    rows.sort(function (a, b) {
      return String(a.generic_name).localeCompare(String(b.generic_name))
    })
    var payload = { results: rows, total: rows.length }
    cache.put('medications', JSON.stringify(payload), CONFIG.CATALOG_CACHE_SEC)
    return payload
  }

  function create_(p, ctx) {
    ValidationService.require(p, 'generic_name')
    var now = nowIso_()
    var record = { medication_id: uuid_(), created_at: now, updated_at: now, status: 'active' }
    FIELDS.forEach(function (f) { record[f] = sanitizeText_(p[f], CONFIG.MAX_TEXT_LEN) })
    SheetRepository.insert(SHEETS.MEDICATIONS, record)
    CacheService.getScriptCache().remove('medications')
    AuditService.log({
      action: 'createMedication', entityType: 'medication', entityId: record.medication_id,
      summary: 'Medicamento creado', requestId: ctx.requestId,
    })
    return record
  }

  function update_(p, ctx, meta) {
    var id = ValidationService.require(p, 'medication_id')
    var current = SheetRepository.findById(SHEETS.MEDICATIONS, id)
    if (!current) throw errorObj_('NOT_FOUND', 'Medicamento no encontrado.')
    assertNoConflict_(current, meta)
    var changes = { updated_at: nowIso_() }
    FIELDS.forEach(function (f) {
      if (p[f] !== undefined) changes[f] = sanitizeText_(p[f], CONFIG.MAX_TEXT_LEN)
    })
    var updated = SheetRepository.updateById(SHEETS.MEDICATIONS, id, changes)
    CacheService.getScriptCache().remove('medications')
    AuditService.log({
      action: 'updateMedication', entityType: 'medication', entityId: id,
      summary: 'Medicamento actualizado', requestId: ctx.requestId,
    })
    return cleanRow_(updated)
  }

  return { list: list_, create: create_, update: update_ }
})()
