import { describe, it, expect } from 'vitest'
import { generateWhatsAppNote } from './noteGenerator'

describe('generateWhatsAppNote', () => {
  const patient = {
    name: 'Max',
    species: 'canino',
    breed: 'Mestizo',
    approximate_age: '5 años',
    weight: 18.4,
  } as const
  const owner = { full_name: 'Laura Pérez' }

  it('incluye identificación y títulos obligatorios aunque falten datos', () => {
    const note = generateWhatsAppNote({ consultation: { reason: 'Vómito' }, patient, owner })
    expect(note).toContain('*Identificación:*')
    expect(note).toContain('Paciente: Max')
    expect(note).toContain('Tutor: Laura Pérez')
    expect(note).toContain('*📋 Motivo de consulta:*')
    expect(note).toContain('Vómito')
    // Título obligatorio presente aunque vacío:
    expect(note).toContain('*🩹 Tratamiento:*')
  })

  it('omite campos opcionales vacíos (diferenciales, recomendaciones)', () => {
    const note = generateWhatsAppNote({ consultation: { reason: 'x' }, patient })
    expect(note).not.toContain('Diagnósticos diferenciales')
    expect(note).not.toContain('Recomendaciones')
  })

  it('arma el examen físico solo cuando hay hallazgos', () => {
    const withExam = generateWhatsAppNote({
      consultation: { head_neck: 'Sin alteraciones' },
      patient,
    })
    expect(withExam).toContain('*🩺 Examen físico:*')
    expect(withExam).toContain('_Cabeza y cuello:_')

    const withoutExam = generateWhatsAppNote({ consultation: { reason: 'x' }, patient })
    expect(withoutExam).not.toContain('*🩺 Examen físico:*')
  })

  it('respeta la opción de excluir al tutor', () => {
    const note = generateWhatsAppNote(
      { consultation: { reason: 'x' }, patient, owner },
      { includeOwner: false },
    )
    expect(note).not.toContain('Tutor:')
  })

  it('incluye los campos personalizados con contenido y omite los vacíos', () => {
    const custom_values = JSON.stringify([
      { label: 'Lote de vacuna', value: 'AB-123' },
      { label: 'Vacía', value: '' },
    ])
    const note = generateWhatsAppNote({ consultation: { reason: 'x', custom_values }, patient })
    expect(note).toContain('*Lote de vacuna:*')
    expect(note).toContain('AB-123')
    expect(note).not.toContain('*Vacía:*')
  })

  it('tolera custom_values inválido sin romper', () => {
    const note = generateWhatsAppNote({
      consultation: { reason: 'x', custom_values: 'no-es-json' },
      patient,
    })
    expect(note).toContain('*📋 Motivo de consulta:*')
  })
})
