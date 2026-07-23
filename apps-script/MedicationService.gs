/**
 * MedicationService.gs — Catálogo auxiliar de medicamentos.
 * No realiza recomendaciones automáticas de dosis (juicio clínico humano).
 */

var MedicationService = (function () {
  function list_() {
    var cache = CacheService.getScriptCache()
    var cached = cache.get('medications')
    if (cached) return JSON.parse(cached)
    var rows = SheetRepository.findAll(SHEETS.MEDICATIONS, function (m) {
      return m.status !== 'deleted'
    }).map(cleanRow_)
    var payload = { results: rows, total: rows.length }
    cache.put('medications', JSON.stringify(payload), CONFIG.CATALOG_CACHE_SEC)
    return payload
  }

  return { list: list_ }
})()
