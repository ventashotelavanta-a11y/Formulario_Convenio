export interface TarifaValorExport {
  tipoHabitacion: string
  pax: number
  montoActual: number | null
}

export interface TarifaPersonaExtraExport {
  tipoHabitacion: string
  montoActual: number | null
}

export interface TarifaConValores {
  nombre: string
  valores: TarifaValorExport[]
  personaExtra: TarifaPersonaExtraExport[]
}

export interface TarifasJsonV1 {
  version: string
  fechaActualizacion: string
  vigenciaDesde: string
  vigenciaHasta: string
  tarifas: {
    habitacionKingSinDesayuno: number
    habitacionQueenSinDesayuno: number
    habitacionKingDesayunoAmericano: number
    habitacionQueenDesayunoAmericano: number
    habitacionKingDesayunoBuffet: number
    habitacionQueenDesayunoBuffet: number
  }
  moneda: string
  codigoPromo: string
}

const V1_MODULE_MAP: Record<string, keyof TarifasJsonV1['tarifas']> = {
  'Convenio Avanta Sin Desayuno|Sencilla King Hotel': 'habitacionKingSinDesayuno',
  'Convenio Avanta Sin Desayuno|Doble Queen Hotel': 'habitacionQueenSinDesayuno',
  'Convenio Avanta Con Desayuno Americano|Sencilla King Hotel': 'habitacionKingDesayunoAmericano',
  'Convenio Avanta Con Desayuno Americano|Doble Queen Hotel': 'habitacionQueenDesayunoAmericano',
  'Convenio Avanta Con Desayuno Buffet|Sencilla King Hotel': 'habitacionKingDesayunoBuffet',
  'Convenio Avanta Con Desayuno Buffet|Doble Queen Hotel': 'habitacionQueenDesayunoBuffet',
}

export function buildTarifasJson(anio: number, tarifas: TarifaConValores[]): TarifasJsonV1 {
  const tarifasOut = {} as TarifasJsonV1['tarifas']
  for (const tarifa of tarifas) {
    for (const valor of tarifa.valores) {
      if (valor.pax !== 1 || valor.montoActual === null) continue
      const key = V1_MODULE_MAP[`${tarifa.nombre}|${valor.tipoHabitacion}`]
      if (key) tarifasOut[key] = valor.montoActual
    }
  }
  const hoy = new Date().toISOString().slice(0, 10)
  return {
    version: String(anio),
    fechaActualizacion: hoy,
    vigenciaDesde: `${anio}-01-01`,
    vigenciaHasta: `${anio}-12-31`,
    tarifas: tarifasOut,
    moneda: 'MXN',
    codigoPromo: 'AVANTA',
  }
}

type Desayuno = 'Sin Desayuno' | 'Con Desayuno Buffet' | 'Con Desayuno Americano'
type PaxTable = Record<number, number>
export type TarifasCotizadorJson = Record<'Con Convenio' | 'Sin Convenio', Record<Desayuno, Record<string, PaxTable>>>

const COTIZADOR_MODULE_MAP: Record<string, { grupo: 'Con Convenio' | 'Sin Convenio'; desayuno: Desayuno }> = {
  'Convenio Avanta Sin Desayuno': { grupo: 'Con Convenio', desayuno: 'Sin Desayuno' },
  'Convenio Avanta Con Desayuno Buffet': { grupo: 'Con Convenio', desayuno: 'Con Desayuno Buffet' },
  'Convenio Avanta Con Desayuno Americano': { grupo: 'Con Convenio', desayuno: 'Con Desayuno Americano' },
  'Sin Convenio Sin Desayuno': { grupo: 'Sin Convenio', desayuno: 'Sin Desayuno' },
  'Sin Convenio Con Desayuno Buffet': { grupo: 'Sin Convenio', desayuno: 'Con Desayuno Buffet' },
  'Sin Convenio Con Desayuno Americano': { grupo: 'Sin Convenio', desayuno: 'Con Desayuno Americano' },
}

export function buildTarifasCotizadorJson(tarifas: TarifaConValores[]): TarifasCotizadorJson {
  const out: TarifasCotizadorJson = { 'Con Convenio': {} as any, 'Sin Convenio': {} as any }

  for (const tarifa of tarifas) {
    const mapping = COTIZADOR_MODULE_MAP[tarifa.nombre]
    if (!mapping) continue // OTA's módulos aren't part of this export

    out[mapping.grupo][mapping.desayuno] ??= {}
    const porHabitacion = out[mapping.grupo][mapping.desayuno]

    const extraPorHabitacion = new Map(tarifa.personaExtra.map((e) => [e.tipoHabitacion, e.montoActual]))

    for (const valor of tarifa.valores) {
      if (valor.montoActual === null) continue
      porHabitacion[valor.tipoHabitacion] ??= {}
      porHabitacion[valor.tipoHabitacion][valor.pax] = valor.montoActual

      if (valor.pax === 4) {
        const extra = extraPorHabitacion.get(valor.tipoHabitacion)
        if (extra !== undefined && extra !== null) {
          porHabitacion[valor.tipoHabitacion][5] = valor.montoActual + extra
        }
      }
    }
  }

  return out
}
