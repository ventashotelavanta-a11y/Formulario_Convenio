import { describe, it, expect } from 'vitest'
import { buildTarifasJson, buildTarifasCotizadorJson, type TarifaConValores } from './exportFormats'

const convenioSin: TarifaConValores = {
  nombre: 'Convenio Avanta Sin Desayuno',
  valores: [
    { tipoHabitacion: 'Sencilla King Hotel', pax: 1, montoActual: 800 },
    { tipoHabitacion: 'Sencilla King Hotel', pax: 2, montoActual: 800 },
    { tipoHabitacion: 'Doble Queen Hotel', pax: 1, montoActual: 1000 },
    { tipoHabitacion: 'Doble Queen Hotel', pax: 2, montoActual: 1000 },
    { tipoHabitacion: 'Doble Queen Hotel', pax: 4, montoActual: 1200 },
  ],
  personaExtra: [{ tipoHabitacion: 'Doble Queen Hotel', montoActual: 100 }],
}

describe('buildTarifasJson', () => {
  it('maps the Convenio Avanta módulos onto the flat 6-key shape', () => {
    const result = buildTarifasJson(2026, [convenioSin])
    expect(result.version).toBe('2026')
    expect(result.tarifas.habitacionKingSinDesayuno).toBe(800)
    expect(result.tarifas.habitacionQueenSinDesayuno).toBe(1000)
  })
})

describe('buildTarifasCotizadorJson', () => {
  it('computes pax 5 as pax 4 plus persona_extra for capacity-5 rooms', () => {
    const result = buildTarifasCotizadorJson([convenioSin])
    const queen = result['Con Convenio']['Sin Desayuno']['Doble Queen Hotel']
    expect(queen[4]).toBe(1200)
    expect(queen[5]).toBe(1300) // 1200 + 100 persona_extra
  })

  it('omits pax 5 for rooms with no persona_extra entry', () => {
    const result = buildTarifasCotizadorJson([convenioSin])
    const king = result['Con Convenio']['Sin Desayuno']['Sencilla King Hotel']
    expect(king[5]).toBeUndefined()
  })
})
