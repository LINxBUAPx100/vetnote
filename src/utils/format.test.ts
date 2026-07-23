import { describe, it, expect } from 'vitest'
import { phoneDigits } from './format'

describe('phoneDigits', () => {
  // Regresión: Google Sheets puede devolver el teléfono como número.
  it('acepta un número (no solo string) sin romper', () => {
    expect(phoneDigits(9984605333 as unknown as number)).toBe('9984605333')
  })
  it('extrae solo dígitos de un string con formato', () => {
    expect(phoneDigits('55-1234 5678')).toBe('5512345678')
  })
  it('devuelve cadena vacía para null/undefined', () => {
    expect(phoneDigits(undefined)).toBe('')
    expect(phoneDigits(null)).toBe('')
  })
})
