/**
 * ConsultationService.gs — Consultas y seguimientos.
 * Guarda copia de la nota de WhatsApp generada en su momento.
 */

var ConsultationService = (function () {
  var TEXT_FIELDS = [
    'reason', 'remote_anamnesis', 'current_anamnesis', 'general_condition',
    'mucous_membranes', 'hydration', 'head_neck', 'thorax_forelimbs',
    'abdomen_hindlimbs_anus_tail', 'additional_exam', 'treatment',
    'presumptive_diagnosis', 'differential_diagnosis', 'recommendations',
    'whatsapp_note',
  ]
  var NUM_FIELDS = ['temperature', 'heart_rate', 'respiratory_rate', 'weight']

  function create_(p, ctx) {
    ValidationService.validateConsultation(p)
    if (!SheetRepository.findById(SHEETS.PATIENTS, p.patient_id)) {
      throw errorObj_('VALIDATION_ERROR', 'El paciente indicado no existe.')
    }
    var now = nowIso_()
    var record = {
      consultation_id: uuid_(),
      patient_id: p.patient_id,
      parent_consultation_id: sanitizeText_(p.parent_consultation_id, 60),
      consultation_type: p.consultation_type === 'follow_up' ? 'follow_up' : 'consulta',
      consultation_date: defaultIfEmpty_(sanitizeText_(p.consultation_date, 30), now),
      follow_up_date: sanitizeText_(p.follow_up_date, 30),
      created_at: now,
      updated_at: now,
      created_by: ctx.userId || '',
      status: 'active',
    }
    TEXT_FIELDS.forEach(function (f) { record[f] = sanitizeText_(p[f], CONFIG.MAX_TEXT_LEN) })
    NUM_FIELDS.forEach(function (f) { record[f] = toNumberOrEmpty_(p[f]) })

    SheetRepository.insert(SHEETS.CONSULTATIONS, record)
    AuditService.log({
      action: 'createConsultation', entityType: 'consultation',
      entityId: record.consultation_id, summary: 'Consulta creada',
      requestId: ctx.requestId, userId: ctx.userId,
    })
    return record
  }

  function get_(p) {
    var id = ValidationService.require(p, 'consultation_id')
    var c = SheetRepository.findById(SHEETS.CONSULTATIONS, id)
    if (!c || c.status === 'deleted') throw errorObj_('NOT_FOUND', 'Consulta no encontrada.')
    return cleanRow_(c)
  }

  function update_(p, ctx, meta) {
    var id = ValidationService.require(p, 'consultation_id')
    var current = SheetRepository.findById(SHEETS.CONSULTATIONS, id)
    if (!current || current.status === 'deleted') {
      throw errorObj_('NOT_FOUND', 'Consulta no encontrada.')
    }
    assertNoConflict_(current, meta)
    var changes = { updated_at: nowIso_() }
    TEXT_FIELDS.forEach(function (f) {
      if (p[f] !== undefined) changes[f] = sanitizeText_(p[f], CONFIG.MAX_TEXT_LEN)
    })
    NUM_FIELDS.forEach(function (f) {
      if (p[f] !== undefined) changes[f] = toNumberOrEmpty_(p[f])
    })
    if (p.consultation_date !== undefined) changes.consultation_date = sanitizeText_(p.consultation_date, 30)
    if (p.follow_up_date !== undefined) changes.follow_up_date = sanitizeText_(p.follow_up_date, 30)

    var updated = SheetRepository.updateById(SHEETS.CONSULTATIONS, id, changes)
    AuditService.log({
      action: 'updateConsultation', entityType: 'consultation', entityId: id,
      summary: 'Consulta actualizada', requestId: ctx.requestId, userId: ctx.userId,
    })
    return cleanRow_(updated)
  }

  /** Historial clínico de un paciente, más reciente primero. */
  function history_(p) {
    var patientId = ValidationService.require(p, 'patient_id')
    var rows = SheetRepository.findAll(SHEETS.CONSULTATIONS, function (c) {
      return String(c.patient_id) === String(patientId) && c.status !== 'deleted'
    })
    rows.sort(function (a, b) {
      return String(b.consultation_date).localeCompare(String(a.consultation_date))
    })
    return { results: rows.map(cleanRow_), total: rows.length }
  }

  /** Consultas más recientes de toda la clínica (dashboard). */
  function listRecent_(p) {
    var limit = Math.min(Number(p && p.limit) || 10, CONFIG.MAX_PAGE_SIZE)
    var rows = SheetRepository.findAll(SHEETS.CONSULTATIONS, function (c) {
      return c.status !== 'deleted'
    })
    rows.sort(function (a, b) {
      return String(b.created_at).localeCompare(String(a.created_at))
    })
    return { results: rows.slice(0, limit).map(cleanRow_), total: rows.length }
  }

  function softDelete_(p, ctx) {
    var id = ValidationService.require(p, 'consultation_id')
    var current = SheetRepository.findById(SHEETS.CONSULTATIONS, id)
    if (!current) throw errorObj_('NOT_FOUND', 'Consulta no encontrada.')
    SheetRepository.updateById(SHEETS.CONSULTATIONS, id, {
      status: 'deleted', updated_at: nowIso_(),
    })
    AuditService.log({
      action: 'softDeleteConsultation', entityType: 'consultation', entityId: id,
      summary: 'Consulta dada de baja (lógica)', requestId: ctx.requestId, userId: ctx.userId,
    })
    return { consultation_id: id, status: 'deleted' }
  }

  return {
    create: create_, get: get_, update: update_,
    history: history_, listRecent: listRecent_, softDelete: softDelete_,
  }
})()
