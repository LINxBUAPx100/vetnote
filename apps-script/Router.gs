/**
 * Router.gs — Despacha cada acción al servicio correspondiente.
 * Mantiene el mapa de acciones y marca cuáles requieren lock de escritura.
 */

var Router = (function () {
  // Acciones que escriben en las hojas → requieren LockService.
  var WRITE_ACTIONS = {
    createPatient: true, updatePatient: true, softDeletePatient: true,
    createOwner: true, updateOwner: true, softDeleteOwner: true,
    createConsultation: true, updateConsultation: true, softDeleteConsultation: true,
    createTemplate: true, updateTemplate: true,
    createMedication: true, updateMedication: true,
    updateSettings: true,
  }

  function isWrite_(action) {
    return WRITE_ACTIONS[action] === true
  }

  function dispatch_(action, payload, ctx, meta) {
    switch (action) {
      case 'healthCheck':
        return healthCheck_()

      // Pacientes
      case 'createPatient': return PatientService.create(payload, ctx)
      case 'updatePatient': return PatientService.update(payload, ctx, meta)
      case 'getPatient': return PatientService.get(payload)
      case 'searchPatients': return PatientService.search(payload)
      case 'listPatients': return PatientService.list(payload)
      case 'listPatientsByOwner': return PatientService.listByOwner(payload)
      case 'softDeletePatient': return PatientService.softDelete(payload, ctx)

      // Tutores
      case 'createOwner': return OwnerService.create(payload, ctx)
      case 'updateOwner': return OwnerService.update(payload, ctx, meta)
      case 'getOwner': return OwnerService.get(payload)
      case 'searchOwners': return OwnerService.search(payload)
      case 'listOwners': return OwnerService.list(payload)
      case 'softDeleteOwner': return OwnerService.softDelete(payload, ctx)

      // Consultas
      case 'createConsultation': return ConsultationService.create(payload, ctx)
      case 'updateConsultation': return ConsultationService.update(payload, ctx, meta)
      case 'getConsultation': return ConsultationService.get(payload)
      case 'getPatientHistory': return ConsultationService.history(payload)
      case 'listRecentConsultations': return ConsultationService.listRecent(payload)
      case 'softDeleteConsultation': return ConsultationService.softDelete(payload, ctx)

      // Plantillas y medicamentos
      case 'createTemplate': return TemplateService.create(payload, ctx)
      case 'updateTemplate': return TemplateService.update(payload, ctx, meta)
      case 'listTemplates': return TemplateService.list()
      case 'listMedications': return MedicationService.list()
      case 'createMedication': return MedicationService.create(payload, ctx)
      case 'updateMedication': return MedicationService.update(payload, ctx, meta)

      // Configuración y export
      case 'getSettings': return SettingsService.getAll()
      case 'updateSettings': return SettingsService.update(payload, ctx)
      case 'exportData': return exportData_(payload)

      default:
        throw errorObj_('UNKNOWN_ACTION', 'Acción no reconocida: ' + action)
    }
  }

  return { dispatch: dispatch_, isWrite: isWrite_ }
})()
