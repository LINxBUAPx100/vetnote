import { describe, it, expect } from 'vitest'
import { approxAgeToBirthDate, genderWord, splitPhone } from './format'

describe('approxAgeToBirthDate', () => {
  const year = new Date().getFullYear()

  it('interpreta un número suelto como años', () => {
    expect(approxAgeToBirthDate('17').slice(0, 4)).toBe(String(year - 17))
  })

  it('interpreta "5 años"', () => {
    expect(approxAgeToBirthDate('5 años').slice(0, 4)).toBe(String(year - 5))
  })

  it('devuelve vacío para texto no interpretable o vacío', () => {
    expect(approxAgeToBirthDate('')).toBe('')
    expect(approxAgeToBirthDate('cachorro')).toBe('')
  })
})

describe('genderWord', () => {
  it('elige según el sexo', () => {
    expect(genderWord('macho', 'atendido', 'atendida')).toBe('atendido')
    expect(genderWord('hembra', 'atendido', 'atendida')).toBe('atendida')
  })
  it('combina ambas si el sexo es desconocido', () => {
    expect(genderWord('desconocido', 'listo', 'lista')).toBe('listo/lista')
    expect(genderWord(undefined, 'él', 'ella')).toBe('él/ella')
  })
})

describe('splitPhone', () => {
  it('separa lada y número local', () => {
    expect(splitPhone('+52 282 107 5306')).toEqual({ code: '52', local: '2821075306' })
    expect(splitPhone('2821075306')).toEqual({ code: '', local: '2821075306' })
    expect(splitPhone('')).toEqual({ code: '', local: '' })
  })
})
