import { describe, it, expect } from 'vitest'
import { ownerSchema, patientSchema, isConsultationEmpty } from './index'

describe('ownerSchema', () => {
  it('exige nombre del tutor', () => {
    expect(ownerSchema.safeParse({ full_name: '' }).success).toBe(false)
    expect(ownerSchema.safeParse({ full_name: 'Laura' }).success).toBe(true)
  })
  it('rechaza correo inválido pero acepta vacío', () => {
    expect(ownerSchema.safeParse({ full_name: 'X', email: 'no-es-correo' }).success).toBe(false)
    expect(ownerSchema.safeParse({ full_name: 'X', email: '' }).success).toBe(true)
  })
})

describe('patientSchema', () => {
  it('exige nombre, especie y tutor', () => {
    expect(patientSchema.safeParse({ name: 'Max', species: 'canino', owner_id: 'o1' }).success).toBe(true)
    expect(patientSchema.safeParse({ name: 'Max', species: 'canino', owner_id: '' }).success).toBe(false)
  })
  it('rechaza peso negativo', () => {
    const r = patientSchema.safeParse({ name: 'Max', species: 'canino', owner_id: 'o1', weight: -3 })
    expect(r.success).toBe(false)
  })
})

describe('isConsultationEmpty', () => {
  it('detecta consulta vacía', () => {
    expect(isConsultationEmpty({})).toBe(true)
    expect(isConsultationEmpty({ reason: '   ' })).toBe(true)
  })
  it('detecta consulta con contenido clínico', () => {
    expect(isConsultationEmpty({ reason: 'Vómito' })).toBe(false)
    expect(isConsultationEmpty({ treatment: 'Fluidos' })).toBe(false)
  })
})
