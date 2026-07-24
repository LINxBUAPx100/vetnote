import { describe, it, expect } from 'vitest'
import {
  toDateTimeLocalValue,
  fromDateTimeLocalValue,
  formatTime,
} from './format'

describe('helpers de fecha y hora', () => {
  it('convierte ISO a valor datetime-local y de vuelta a ISO (ida y vuelta)', () => {
    const local = '2026-07-24T14:30'
    const iso = fromDateTimeLocalValue(local)
    // El ISO debe representar el mismo instante local al reconvertir.
    expect(toDateTimeLocalValue(iso)).toBe(local)
  })

  it('devuelve cadena vacía ante valores vacíos o inválidos', () => {
    expect(toDateTimeLocalValue('')).toBe('')
    expect(toDateTimeLocalValue(undefined)).toBe('')
    expect(fromDateTimeLocalValue('')).toBe('')
  })

  it('formatTime extrae la hora de un ISO', () => {
    const iso = fromDateTimeLocalValue('2026-07-24T09:05')
    expect(formatTime(iso)).toBe('09:05')
  })
})
