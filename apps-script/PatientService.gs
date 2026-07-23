/**
 * PatientService.gs — Pacientes. IDs por UUID. Baja lógica vía status.
 */

var PatientService = (function () {
  function create_(p, ctx) {
    ValidationService.validatePatient(p)
    // Verifica que el tutor exista.
    if (!SheetRepository.findById(SHEETS.OWNERS, p.owner_id)) {
      throw errorObj_('VALIDATION_ERROR', 'El tutor indicado no existe.')
    }
    var now = nowIso_()
    var record = {
      patient_id: uuid_(),
      owner_id: p.owner_id,
      name: sanitizeText_(p.name, 100),
      species: sanitizeText_(p.species, 30),
      breed: sanitizeText_(p.breed, 80),
      sex: sanitizeText_(p.sex, 20),
      birth_date: sanitizeText_(p.birth_date, 30),
      approximate_age: sanitizeText_(p.approximate_age, 40),
      color: sanitizeText_(p.color, 60),
      weight: toNumberOrEmpty_(p.weight),
      sterilized: p.sterilized === true || p.sterilized === 'true' ? 'true' : 'false',
      microchip: sanitizeText_(p.microchip, 60),
      clinical_notes: sanitizeText_(p.clinical_notes, CONFIG.MAX_TEXT_LEN),
      created_at: now,
      updated_at: now,
      created_by: ctx.userId || '',
      status: 'active',
    }
    SheetRepository.insert(SHEETS.PATIENTS, record)
    AuditService.log({
      action: 'createPatient', entityType: 'patient', entityId: record.patient_id,
      summary: 'Paciente creado', requestId: ctx.requestId, userId: ctx.userId,
    })
    return record
  }

  function get_(p) {
    var id = ValidationService.require(p, 'patient_id')
    var patient = SheetRepository.findById(SHEETS.PATIENTS, id)
    if (!patient || patient.status === 'deleted') {
      throw errorObj_('NOT_FOUND', 'Paciente no encontrado.')
    }
    var owner = SheetRepository.findById(SHEETS.OWNERS, patient.owner_id)
    var result = cleanRow_(patient)
    result.owner = owner ? cleanRow_(owner) : null
    return result
  }

  function update_(p, ctx, meta) {
    var id = ValidationService.require(p, 'patient_id')
    var current = SheetRepository.findById(SHEETS.PATIENTS, id)
    if (!current || current.status === 'deleted') {
      throw errorObj_('NOT_FOUND', 'Paciente no encontrado.')
    }
    assertNoConflict_(current, meta)
    var fields = ['name', 'species', 'breed', 'sex', 'birth_date', 'approximate_age',
      'color', 'microchip', 'clinical_notes']
    var changes = { updated_at: nowIso_() }
    fields.forEach(function (f) {
      if (p[f] !== undefined) changes[f] = sanitizeText_(p[f], CONFIG.MAX_TEXT_LEN)
    })
    if (p.weight !== undefined) changes.weight = toNumberOrEmpty_(p.weight)
    if (p.sterilized !== undefined) {
      changes.sterilized = p.sterilized === true || p.sterilized === 'true' ? 'true' : 'false'
    }
    var updated = SheetRepository.updateById(SHEETS.PATIENTS, id, changes)
    AuditService.log({
      action: 'updatePatient', entityType: 'patient', entityId: id,
      summary: 'Paciente actualizado', requestId: ctx.requestId, userId: ctx.userId,
    })
    return cleanRow_(updated)
  }

  /** Búsqueda parcial por nombre de paciente, tutor, teléfono, raza, especie o id. */
  function search_(p) {
    var q = sanitizeText_(p && p.query ? p.query : '', 100).toLowerCase()
    var limit = Math.min(Number(p && p.limit) || CONFIG.DEFAULT_PAGE_SIZE, CONFIG.MAX_PAGE_SIZE)
    if (!q) return { results: [], total: 0 }

    var owners = SheetRepository.findAll(SHEETS.OWNERS)
    var ownerById = {}
    owners.forEach(function (o) { ownerById[o.owner_id] = o })

    var matches = SheetRepository.findAll(SHEETS.PATIENTS, function (pt) {
      if (pt.status === 'deleted') return false
      var owner = ownerById[pt.owner_id]
      var haystack = [
        pt.name, pt.breed, pt.species, pt.patient_id,
        owner ? owner.full_name : '', owner ? owner.phone : '',
      ].join(' ').toLowerCase()
      return haystack.indexOf(q) !== -1
    })

    var results = matches.slice(0, limit).map(function (pt) {
      var owner = ownerById[pt.owner_id]
      var row = cleanRow_(pt)
      row.owner_name = owner ? owner.full_name : ''
      row.owner_phone = owner ? owner.phone : ''
      return row
    })
    return { results: results, total: matches.length }
  }

  /** Listado paginado de pacientes activos, más recientes primero. */
  function list_(p) {
    var page = Math.max(1, Number(p && p.page) || 1)
    var size = Math.min(Number(p && p.pageSize) || CONFIG.DEFAULT_PAGE_SIZE, CONFIG.MAX_PAGE_SIZE)
    var all = SheetRepository.findAll(SHEETS.PATIENTS, function (pt) {
      return pt.status !== 'deleted'
    })
    all.sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)) })
    var start = (page - 1) * size
    return {
      results: all.slice(start, start + size).map(cleanRow_),
      total: all.length,
      page: page,
      pageSize: size,
    }
  }

  function softDelete_(p, ctx) {
    var id = ValidationService.require(p, 'patient_id')
    var current = SheetRepository.findById(SHEETS.PATIENTS, id)
    if (!current) throw errorObj_('NOT_FOUND', 'Paciente no encontrado.')
    SheetRepository.updateById(SHEETS.PATIENTS, id, {
      status: 'deleted', updated_at: nowIso_(),
    })
    AuditService.log({
      action: 'softDeletePatient', entityType: 'patient', entityId: id,
      summary: 'Paciente dado de baja (lógica)', requestId: ctx.requestId, userId: ctx.userId,
    })
    return { patient_id: id, status: 'deleted' }
  }

  return {
    create: create_, get: get_, update: update_,
    search: search_, list: list_, softDelete: softDelete_,
  }
})()
