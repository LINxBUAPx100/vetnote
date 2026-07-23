/**
 * ValidationService.gs — Validación de payloads en el servidor.
 * La validación del cliente (Zod) no sustituye a esta: el backend nunca confía
 * en el cliente. Ver docs/03-api-contrato.md.
 */

var ValidationService = (function () {
  function require_(payload, field) {
    var v = payload ? payload[field] : undefined
    if (v === undefined || v === null || String(v).trim() === '') {
      throw errorObj_('VALIDATION_ERROR', 'Falta el campo obligatorio: ' + field)
    }
    return v
  }

  function validateOwner_(p) {
    require_(p, 'full_name')
    // Teléfono opcional pero, si viene, se sanea a dígitos/símbolos válidos.
    return true
  }

  function validatePatient_(p) {
    require_(p, 'name')
    require_(p, 'species')
    require_(p, 'owner_id')
    if (p.weight !== undefined && p.weight !== '' && Number(p.weight) < 0) {
      throw errorObj_('VALIDATION_ERROR', 'El peso no puede ser negativo.')
    }
    return true
  }

  function validateConsultation_(p) {
    require_(p, 'patient_id')
    // No permitir una consulta completamente vacía (algún campo clínico mínimo).
    var clinicalFields = [
      'reason', 'current_anamnesis', 'presumptive_diagnosis', 'treatment',
      'head_neck', 'thorax_forelimbs', 'abdomen_hindlimbs_anus_tail',
    ]
    var hasContent = clinicalFields.some(function (f) {
      return p[f] && String(p[f]).trim() !== ''
    })
    if (!hasContent) {
      throw errorObj_('VALIDATION_ERROR', 'La consulta no puede estar completamente vacía.')
    }
    return true
  }

  return {
    require: require_,
    validateOwner: validateOwner_,
    validatePatient: validatePatient_,
    validateConsultation: validateConsultation_,
  }
})()
