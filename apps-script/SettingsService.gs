/**
 * SettingsService.gs — Configuración clave/valor de la clínica.
 */

var SettingsService = (function () {
  function getAll_() {
    var cache = CacheService.getScriptCache()
    var cached = cache.get('settings')
    if (cached) return JSON.parse(cached)
    var rows = SheetRepository.findAll(SHEETS.SETTINGS)
    var map = {}
    rows.forEach(function (r) {
      if (r.setting_key) map[r.setting_key] = r.setting_value
    })
    cache.put('settings', JSON.stringify(map), CONFIG.CATALOG_CACHE_SEC)
    return map
  }

  /** Actualiza (o crea) claves de configuración a partir de un objeto plano. */
  function update_(p, ctx) {
    if (!p || typeof p !== 'object') {
      throw errorObj_('VALIDATION_ERROR', 'Configuración inválida.')
    }
    var now = nowIso_()
    Object.keys(p).forEach(function (key) {
      var value = sanitizeText_(p[key], CONFIG.MAX_TEXT_LEN)
      var existing = SheetRepository.findById(SHEETS.SETTINGS, key)
      if (existing) {
        SheetRepository.updateById(SHEETS.SETTINGS, key, {
          setting_value: value, updated_at: now,
        })
      } else {
        SheetRepository.insert(SHEETS.SETTINGS, {
          setting_key: key, setting_value: value, description: '', updated_at: now,
        })
      }
    })
    CacheService.getScriptCache().remove('settings')
    AuditService.log({
      action: 'updateSettings', entityType: 'settings', entityId: '',
      summary: 'Configuración actualizada', requestId: ctx.requestId,
    })
    return getAll_()
  }

  return { getAll: getAll_, update: update_ }
})()
