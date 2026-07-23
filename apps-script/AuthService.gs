/**
 * AuthService.gs — Seguridad básica: token compartido y rate limiting.
 * Limitación conocida (documentada): al ser una app pública, el token viaja en
 * el tráfico y no sustituye a una autenticación real. Ver docs/01-arquitectura.md.
 */

var AuthService = (function () {
  /** Verifica el token del cuerpo contra el guardado en Script Properties. */
  function verifyToken_(token) {
    var expected = PropertiesService.getScriptProperties().getProperty(
      CONFIG.TOKEN_PROPERTY,
    )
    if (!expected) {
      // Si no se configuró token, se rechaza por seguridad (fail-closed).
      throw errorObj_('INVALID_TOKEN', 'El servidor no tiene APP_TOKEN configurado.')
    }
    if (!token || String(token) !== String(expected)) {
      throw errorObj_('INVALID_TOKEN', 'Token de aplicación inválido.')
    }
    return true
  }

  /**
   * Rate limiting básico por ventana usando CacheService.
   * `clientKey` puede ser el clientRequestId prefix o un identificador estable.
   */
  function checkRateLimit_(clientKey) {
    var cache = CacheService.getScriptCache()
    var bucket = 'rl_' + (clientKey || 'anon')
    var current = Number(cache.get(bucket) || '0')
    if (current >= CONFIG.RATE_LIMIT_MAX) {
      throw errorObj_('RATE_LIMITED', 'Demasiadas solicitudes. Intenta en un momento.')
    }
    cache.put(bucket, String(current + 1), CONFIG.RATE_LIMIT_WINDOW_SEC)
    return true
  }

  return {
    verifyToken: verifyToken_,
    checkRateLimit: checkRateLimit_,
  }
})()
