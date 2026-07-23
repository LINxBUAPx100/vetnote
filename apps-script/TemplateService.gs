/**
 * TemplateService.gs — Plantillas de consulta (catálogo editable).
 */

var TemplateService = (function () {
  var FIELDS = [
    'name', 'description', 'species', 'category', 'reason', 'remote_anamnesis',
    'current_anamnesis', 'head_neck', 'thorax_forelimbs',
    'abdomen_hindlimbs_anus_tail', 'treatment', 'presumptive_diagnosis',
    'recommendations',
  ]

  function list_() {
    var cache = CacheService.getScriptCache()
    var cached = cache.get('templates')
    if (cached) return JSON.parse(cached)
    var rows = SheetRepository.findAll(SHEETS.TEMPLATES, function (t) {
      return t.status !== 'deleted'
    }).map(cleanRow_)
    var payload = { results: rows, total: rows.length }
    cache.put('templates', JSON.stringify(payload), CONFIG.CATALOG_CACHE_SEC)
    return payload
  }

  function create_(p, ctx) {
    ValidationService.require(p, 'name')
    var now = nowIso_()
    var record = { template_id: uuid_(), created_at: now, updated_at: now, status: 'active' }
    FIELDS.forEach(function (f) { record[f] = sanitizeText_(p[f], CONFIG.MAX_TEXT_LEN) })
    SheetRepository.insert(SHEETS.TEMPLATES, record)
    CacheService.getScriptCache().remove('templates')
    AuditService.log({
      action: 'createTemplate', entityType: 'template', entityId: record.template_id,
      summary: 'Plantilla creada', requestId: ctx.requestId,
    })
    return record
  }

  function update_(p, ctx, meta) {
    var id = ValidationService.require(p, 'template_id')
    var current = SheetRepository.findById(SHEETS.TEMPLATES, id)
    if (!current) throw errorObj_('NOT_FOUND', 'Plantilla no encontrada.')
    assertNoConflict_(current, meta)
    var changes = { updated_at: nowIso_() }
    FIELDS.forEach(function (f) {
      if (p[f] !== undefined) changes[f] = sanitizeText_(p[f], CONFIG.MAX_TEXT_LEN)
    })
    var updated = SheetRepository.updateById(SHEETS.TEMPLATES, id, changes)
    CacheService.getScriptCache().remove('templates')
    AuditService.log({
      action: 'updateTemplate', entityType: 'template', entityId: id,
      summary: 'Plantilla actualizada', requestId: ctx.requestId,
    })
    return cleanRow_(updated)
  }

  return { list: list_, create: create_, update: update_ }
})()
