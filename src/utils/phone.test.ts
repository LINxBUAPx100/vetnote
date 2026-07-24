import { describe, it, expect } from 'vitest'
import { phoneWithCountry, normalizePhoneDisplay } from './format'

describe('teléfonos con lada (+52 por defecto)', () => {
  it('antepone la lada a un número local de 10 dígitos', () => {
    expect(phoneWithCountry('2224606957')).toBe('522224606957')
    expect(phoneWithCountry('282 107 5306')).toBe('522821075306')
  })

  it('respeta números que ya traen lada', () => {
    expect(phoneWithCountry('+52 998 460 9153')).toBe('529984609153')
    expect(phoneWithCountry('529984609153')).toBe('529984609153')
  })

  it('devuelve vacío si no hay teléfono', () => {
    expect(phoneWithCountry('')).toBe('')
    expect(phoneWithCountry(null)).toBe('')
  })

  it('formatea para mostrar con +52 sólo los de 10 dígitos', () => {
    expect(normalizePhoneDisplay('2224606957')).toBe('+52 222 460 6957')
    expect(normalizePhoneDisplay('+52 998 460 9153')).toBe('+52 998 460 9153')
    expect(normalizePhoneDisplay('')).toBe('')
  })
})
