/**
 * OwnerService.gs — Tutores. Un tutor puede tener varios pacientes.
 */

var OwnerService = (function () {
  function create_(p, ctx) {
    ValidationService.validateOwner(p)
    var now = nowIso_()
    var record = {
      owner_id: uuid_(),
      full_name: sanitizeText_(p.full_name, 150),
      phone: sanitizePhone_(p.phone, 40),
      secondary_phone: sanitizePhone_(p.secondary_phone, 40),
      email: sanitizeText_(p.email, 120),
      address: sanitizeText_(p.address, 300),
      notes: sanitizeText_(p.notes, CONFIG.MAX_TEXT_LEN),
      created_at: now,
      updated_at: now,
      status: 'active',
    }
    SheetRepository.insert(SHEETS.OWNERS, record)
    AuditService.log({
      action: 'createOwner', entityType: 'owner', entityId: record.owner_id,
      summary: 'Tutor creado', requestId: ctx.requestId,
    })
    return record
  }

  function get_(p) {
    var id = ValidationService.require(p, 'owner_id')
    var owner = SheetRepository.findById(SHEETS.OWNERS, id)
    if (!owner) throw errorObj_('NOT_FOUND', 'Tutor no encontrado.')
    return cleanRow_(owner)
  }

  function update_(p, ctx, meta) {
    var id = ValidationService.require(p, 'owner_id')
    var current = SheetRepository.findById(SHEETS.OWNERS, id)
    if (!current) throw errorObj_('NOT_FOUND', 'Tutor no encontrado.')
    assertNoConflict_(current, meta)
    var changes = {
      full_name: sanitizeText_(defaultIfEmpty_(p.full_name, current.full_name), 150),
      phone: sanitizePhone_(defaultIfEmpty_(p.phone, current.phone), 40),
      secondary_phone: sanitizePhone_(defaultIfEmpty_(p.secondary_phone, current.secondary_phone), 40),
      email: sanitizeText_(defaultIfEmpty_(p.email, current.email), 120),
      address: sanitizeText_(defaultIfEmpty_(p.address, current.address), 300),
      notes: sanitizeText_(defaultIfEmpty_(p.notes, current.notes), CONFIG.MAX_TEXT_LEN),
      updated_at: nowIso_(),
    }
    var updated = SheetRepository.updateById(SHEETS.OWNERS, id, changes)
    AuditService.log({
      action: 'updateOwner', entityType: 'owner', entityId: id,
      summary: 'Tutor actualizado', requestId: ctx.requestId,
    })
    return cleanRow_(updated)
  }

  /** Búsqueda parcial de tutores por nombre, teléfono o correo. */
  function search_(p) {
    var q = sanitizeText_(p && p.query ? p.query : '', 100).toLowerCase()
    var limit = Math.min(Number(p && p.limit) || CONFIG.DEFAULT_PAGE_SIZE, CONFIG.MAX_PAGE_SIZE)
    if (!q) return { results: [], total: 0 }
    var matches = SheetRepository.findAll(SHEETS.OWNERS, function (o) {
      if (o.status === 'deleted') return false
      var hay = [o.full_name, o.phone, o.secondary_phone, o.email].join(' ').toLowerCase()
      return hay.indexOf(q) !== -1
    })
    return { results: matches.slice(0, limit).map(cleanRow_), total: matches.length }
  }

  return { create: create_, get: get_, update: update_, search: search_ }
})()
