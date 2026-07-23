/**
 * SheetRepository.gs — Única capa de acceso a Google Sheets.
 * Ningún servicio llama a getSheetByName() directamente; todo pasa por aquí.
 * Trabaja por NOMBRE de columna (no por índice fijo) leyendo/escribiendo por
 * rangos completos para minimizar llamadas (rendimiento).
 */

var SheetRepository = (function () {
  function ss_() {
    return SpreadsheetApp.getActiveSpreadsheet()
  }

  function getSheet_(sheetName) {
    var sheet = ss_().getSheetByName(sheetName)
    if (!sheet) {
      throw errorObj_('INTERNAL_ERROR', 'No existe la hoja requerida: ' + sheetName)
    }
    return sheet
  }

  /** Lee todos los datos de una hoja como array de objetos {columna: valor}. */
  function readAll_(sheetName) {
    var sheet = getSheet_(sheetName)
    var lastRow = sheet.getLastRow()
    var headers = HEADERS[sheetName]
    if (lastRow < 2) return { headers: headers, rows: [] }
    var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
    var rows = values.map(function (row, i) {
      var obj = { __rowIndex: i + 2 } // fila real en la hoja (solo uso interno)
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c]
        var val = row[c]
        // Google Sheets devuelve como NÚMERO cualquier celda que solo tenga
        // dígitos (p.ej. un teléfono "9984605333"). Para las columnas de texto
        // forzamos String, evitando errores tipo "x.replace is not a function"
        // en el cliente. Los campos numéricos reales se conservan como número.
        if (typeof val === 'number' && !NUMERIC_FIELDS[h]) val = String(val)
        obj[h] = val
      }
      return obj
    })
    return { headers: headers, rows: rows }
  }

  /** Convierte un registro (objeto) en una fila ordenada según HEADERS. */
  function toRow_(sheetName, record) {
    var headers = HEADERS[sheetName]
    return headers.map(function (h) {
      var v = record[h]
      return v === undefined || v === null ? '' : v
    })
  }

  return {
    /** Busca un registro por su id. Devuelve el objeto o null. */
    findById: function (sheetName, id) {
      var idCol = ID_COLUMN[sheetName]
      var data = readAll_(sheetName)
      for (var i = 0; i < data.rows.length; i++) {
        if (String(data.rows[i][idCol]) === String(id)) return data.rows[i]
      }
      return null
    },

    /** Inserta un registro nuevo (append). Devuelve el registro. */
    insert: function (sheetName, record) {
      var sheet = getSheet_(sheetName)
      sheet.appendRow(toRow_(sheetName, record))
      return record
    },

    /**
     * Actualiza por id aplicando `changes`. Devuelve el registro actualizado o
     * null si no existe. Escribe solo la fila afectada.
     */
    updateById: function (sheetName, id, changes) {
      var idCol = ID_COLUMN[sheetName]
      var data = readAll_(sheetName)
      for (var i = 0; i < data.rows.length; i++) {
        if (String(data.rows[i][idCol]) === String(id)) {
          var updated = data.rows[i]
          for (var k in changes) {
            if (HEADERS[sheetName].indexOf(k) !== -1) updated[k] = changes[k]
          }
          var sheet = getSheet_(sheetName)
          sheet
            .getRange(updated.__rowIndex, 1, 1, HEADERS[sheetName].length)
            .setValues([toRow_(sheetName, updated)])
          return updated
        }
      }
      return null
    },

    /**
     * Devuelve todos los registros que cumplen `predicate(record) === true`.
     * Si no se pasa predicate, devuelve todos.
     */
    findAll: function (sheetName, predicate) {
      var data = readAll_(sheetName)
      if (!predicate) return data.rows
      return data.rows.filter(predicate)
    },

    /** Cuenta filas (excluyendo encabezado). */
    count: function (sheetName) {
      var sheet = getSheet_(sheetName)
      return Math.max(0, sheet.getLastRow() - 1)
    },

    readAll: readAll_,
  }
})()
