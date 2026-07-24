import { describe, it, expect } from 'vitest'
import {
  parseTreatmentItems,
  formatTreatmentItem,
  treatmentItemsToText,
} from './treatment'
import { composeTreatmentText } from './noteGenerator'

describe('treatment', () => {
  it('parsea ítems válidos y descarta los que no tienen nombre', () => {
    const json = JSON.stringify([
      { name: 'Meloxicam', dose: '1 tab', route: 'VO', frequency: 'c/24 h', duration: '5 días' },
      { name: '   ' },
      { dose: 'sin nombre' },
    ])
    const items = parseTreatmentItems(json)
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Meloxicam')
    expect(items[0].dose).toBe('1 tab')
  })

  it('tolera JSON inválido sin romper', () => {
    expect(parseTreatmentItems('no-es-json')).toEqual([])
    expect(parseTreatmentItems(undefined)).toEqual([])
    expect(parseTreatmentItems(null)).toEqual([])
  })

  it('formatea un ítem con posología y notas', () => {
    const line = formatTreatmentItem({
      name: 'Amoxicilina',
      dose: '250 mg',
      route: 'VO',
      frequency: 'c/12 h',
      duration: '7 días',
      notes: 'con alimento',
    })
    expect(line).toBe('Amoxicilina — 250 mg · VO · c/12 h · 7 días (con alimento)')
  })

  it('formatea un ítem solo con nombre', () => {
    expect(formatTreatmentItem({ name: 'Suero' })).toBe('Suero')
  })

  it('vuelca ítems a texto con viñetas', () => {
    const text = treatmentItemsToText([
      { name: 'A', dose: '1' },
      { name: 'B' },
    ])
    expect(text).toBe('• A — 1\n• B')
  })

  it('compone el tratamiento combinando ítems y texto libre', () => {
    const c = {
      treatment_items: JSON.stringify([{ name: 'Meloxicam', dose: '1 tab' }]),
      treatment: 'Reposo relativo',
    }
    const text = composeTreatmentText(c)
    expect(text).toBe('• Meloxicam — 1 tab\nReposo relativo')
  })

  it('compose devuelve solo texto libre cuando no hay ítems', () => {
    expect(composeTreatmentText({ treatment: 'Dieta blanda' })).toBe('Dieta blanda')
  })
})
