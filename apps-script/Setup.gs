/**
 * Setup.gs — Inicialización y migración del esquema de Google Sheets.
 *
 * Ejecuta `setupDatabase` UNA VEZ desde el editor de Apps Script (o cada vez que
 * cambie el esquema). Es idempotente: no borra datos ni duplica columnas.
 */

/** Crea/verifica todas las hojas y sus encabezados. Siembra datos iniciales. */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var report = []

  Object.keys(SHEETS).forEach(function (key) {
    var name = SHEETS[key]
    var sheet = ss.getSheetByName(name)
    if (!sheet) {
      sheet = ss.insertSheet(name)
      report.push('Hoja creada: ' + name)
    }
    ensureHeaders_(sheet, HEADERS[name])
  })

  // Elimina la hoja por defecto "Hoja 1"/"Sheet1" si quedó vacía y sobra.
  ;['Sheet1', 'Hoja 1', 'Hoja1'].forEach(function (n) {
    var s = ss.getSheetByName(n)
    if (s && ss.getSheets().length > 1) {
      try { ss.deleteSheet(s) } catch (e) {}
    }
  })

  seedSettings_()
  seedTemplates_()
  ensureToken_()

  report.push('Esquema v' + CONFIG.SCHEMA_VERSION + ' verificado.')
  Logger.log(report.join('\n'))
  return report
}

/** Garantiza que la fila 1 tenga exactamente los encabezados esperados. */
function ensureHeaders_(sheet, headers) {
  var current = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    : []
  // Añade columnas faltantes al final (migración no destructiva).
  var toWrite = headers.slice()
  for (var i = 0; i < current.length; i++) {
    if (current[i] && headers.indexOf(current[i]) === -1) {
      // Columna existente que no está en el esquema: se conserva al final.
      toWrite.push(current[i])
    }
  }
  sheet.getRange(1, 1, 1, toWrite.length).setValues([toWrite])
  sheet.setFrozenRows(1)
  sheet.getRange(1, 1, 1, toWrite.length).setFontWeight('bold')
}

/** Configura el token de la app si no existe (valor por defecto a cambiar). */
function ensureToken_() {
  var props = PropertiesService.getScriptProperties()
  if (!props.getProperty(CONFIG.TOKEN_PROPERTY)) {
    props.setProperty(CONFIG.TOKEN_PROPERTY, 'cambia-este-token-' + uuid_().substring(0, 8))
  }
}

/** Siembra la configuración inicial de la clínica si la hoja está vacía. */
function seedSettings_() {
  if (SheetRepository.count(SHEETS.SETTINGS) > 0) return
  var now = nowIso_()
  var defaults = [
    ['clinic_name', 'Mi Veterinaria', 'Nombre de la clínica'],
    ['vet_name', 'Médica Veterinaria', 'Nombre de la profesional'],
    ['professional_id', '', 'Cédula profesional'],
    ['phone', '', 'Teléfono de contacto'],
    ['address', '', 'Dirección'],
    ['logo', '', 'URL o base64 del logotipo'],
    ['primary_color', '#2F6F64', 'Color principal'],
    ['note_footer', 'Gracias por confiar en nosotros.', 'Pie de nota'],
    ['date_format', 'dd/MM/yyyy', 'Formato de fecha'],
    ['id_prefix', 'VN', 'Prefijo de identificadores'],
    ['schema_version', CONFIG.SCHEMA_VERSION, 'Versión del esquema'],
  ]
  defaults.forEach(function (row) {
    SheetRepository.insert(SHEETS.SETTINGS, {
      setting_key: row[0], setting_value: row[1], description: row[2], updated_at: now,
    })
  })
}

/** Siembra plantillas iniciales si la hoja está vacía. */
function seedTemplates_() {
  if (SheetRepository.count(SHEETS.TEMPLATES) > 0) return
  var now = nowIso_()
  var base = [
    { name: 'Consulta general', category: 'general', species: '' },
    { name: 'Vacunación', category: 'preventiva', species: '', reason: 'Aplicación de vacuna.' },
    { name: 'Desparasitación', category: 'preventiva', species: '', reason: 'Desparasitación.' },
    { name: 'Gastroenteritis', category: 'digestivo', species: '', presumptive_diagnosis: 'Gastroenteritis.' },
    { name: 'Dermatitis', category: 'dermatologico', species: '', presumptive_diagnosis: 'Dermatitis.' },
    { name: 'Traumatismo', category: 'urgencias', species: '' },
    { name: 'Revisión posoperatoria', category: 'seguimiento', species: '' },
    { name: 'Urgencia', category: 'urgencias', species: '' },
    { name: 'Consulta felina', category: 'general', species: 'felino' },
    { name: 'Consulta geriátrica', category: 'general', species: '' },
  ]
  base.forEach(function (t) {
    SheetRepository.insert(SHEETS.TEMPLATES, {
      template_id: uuid_(),
      name: t.name,
      description: '',
      species: t.species || '',
      category: t.category || '',
      reason: t.reason || '',
      remote_anamnesis: '',
      current_anamnesis: '',
      head_neck: '',
      thorax_forelimbs: '',
      abdomen_hindlimbs_anus_tail: '',
      treatment: '',
      presumptive_diagnosis: t.presumptive_diagnosis || '',
      recommendations: '',
      created_at: now,
      updated_at: now,
      status: 'active',
    })
  })
}

/** Utilidad manual: muestra el token actual en el log (para configurar el frontend). */
function showAppToken() {
  Logger.log(PropertiesService.getScriptProperties().getProperty(CONFIG.TOKEN_PROPERTY))
}
