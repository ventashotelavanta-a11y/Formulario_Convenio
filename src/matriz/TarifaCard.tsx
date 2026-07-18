import { useState } from 'react'
import { api, ApiError } from './api'

export interface TarifaValor {
  tipoHabitacion: string
  pax: number
  montoActual: number | null
  montoPropuesto: number | null
}

export interface TarifaPersonaExtra {
  tipoHabitacion: string
  montoActual: number | null
  montoPropuesto: number | null
}

export interface Tarifa {
  id: number
  nombre: string
  canales: string[]
  valores: TarifaValor[]
  personaExtra: TarifaPersonaExtra[]
}

const TIPOS_HABITACION = ['Sencilla King Hotel', 'Doble Queen Hotel', 'Sencilla King Villas', 'Doble Queen Villas']
const PAX_COLUMNAS = [1, 2, 3, 4]

// Capacidad fija por catálogo (Task 1's seed) — determina qué columnas de pax se
// habilitan por fila. Sencilla King: capacidad 3 → solo pax 1-3, pax 4 deshabilitada.
const CAPACIDAD_PERSONAS: Record<string, number> = {
  'Sencilla King Hotel': 3,
  'Doble Queen Hotel': 5,
  'Sencilla King Villas': 3,
  'Doble Queen Villas': 5,
}

function paxHabilitado(tipoHabitacion: string, pax: number): boolean {
  return pax <= Math.min(CAPACIDAD_PERSONAS[tipoHabitacion], 4)
}

function fmt(monto: number | null): string {
  return monto === null ? 'N/A' : `$${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

export default function TarifaCard({
  tarifa,
  showPropuesta,
  onCellSaved,
}: {
  tarifa: Tarifa
  showPropuesta: boolean
  onCellSaved: () => void
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<{ key: string; message: string } | null>(null)

  function valorDe(tipoHabitacion: string, pax: number) {
    return tarifa.valores.find((v) => v.tipoHabitacion === tipoHabitacion && v.pax === pax) ?? null
  }

  function extraDe(tipoHabitacion: string) {
    return tarifa.personaExtra.find((e) => e.tipoHabitacion === tipoHabitacion) ?? null
  }

  function empezarEdicion(key: string, monto: number | null) {
    setError(null)
    setEditing(key)
    setDraft(monto === null ? '' : String(monto))
  }

  function mensajeError(err: unknown): string {
    return err instanceof ApiError ? err.message : 'No se pudo guardar'
  }

  async function guardarCelda(tipoHabitacion: string, pax: number, campo: 'montoActual' | 'montoPropuesto') {
    const key = `${tipoHabitacion}|${pax}|${campo}`
    const nuevoMonto = draft.trim() === '' ? null : Number(draft)
    if (draft.trim() !== '' && Number.isNaN(nuevoMonto)) return setEditing(null)

    const actual = valorDe(tipoHabitacion, pax)
    try {
      await api.put('/matriz/tarifa-valores', {
        tarifaId: tarifa.id,
        tipoHabitacion,
        pax,
        montoActual: campo === 'montoActual' ? nuevoMonto : actual?.montoActual ?? null,
        montoPropuesto: campo === 'montoPropuesto' ? nuevoMonto : actual?.montoPropuesto ?? null,
      })
      setError(null)
      setEditing(null)
      onCellSaved()
    } catch (err) {
      setError({ key, message: mensajeError(err) })
    }
  }

  async function guardarExtra(tipoHabitacion: string, campo: 'montoActual' | 'montoPropuesto') {
    const key = `extra|${tipoHabitacion}|${campo}`
    const nuevoMonto = draft.trim() === '' ? null : Number(draft)
    if (draft.trim() !== '' && Number.isNaN(nuevoMonto)) return setEditing(null)

    const actual = extraDe(tipoHabitacion)
    try {
      await api.put('/matriz/tarifa-persona-extra', {
        tarifaId: tarifa.id,
        tipoHabitacion,
        montoActual: campo === 'montoActual' ? nuevoMonto : actual?.montoActual ?? null,
        montoPropuesto: campo === 'montoPropuesto' ? nuevoMonto : actual?.montoPropuesto ?? null,
      })
      setError(null)
      setEditing(null)
      onCellSaved()
    } catch (err) {
      setError({ key, message: mensajeError(err) })
    }
  }

  function errorDe(key: string) {
    return error?.key === key ? (
      <div className="text-red-500 text-xs whitespace-nowrap">{error.message}</div>
    ) : null
  }

  function celda(tipoHabitacion: string, pax: number, campo: 'montoActual' | 'montoPropuesto') {
    const key = `${tipoHabitacion}|${pax}|${campo}`
    const valor = valorDe(tipoHabitacion, pax)
    const monto = campo === 'montoActual' ? valor?.montoActual ?? null : valor?.montoPropuesto ?? null

    if (editing === key) {
      return (
        <span className="inline-block">
          <input
            autoFocus
            className="w-24 border rounded px-1 py-0.5 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => guardarCelda(tipoHabitacion, pax, campo)}
            onKeyDown={(e) => e.key === 'Enter' && guardarCelda(tipoHabitacion, pax, campo)}
          />
          {errorDe(key)}
        </span>
      )
    }

    return (
      <button className="text-sm hover:underline" onClick={() => empezarEdicion(key, monto)}>
        {fmt(monto)}
      </button>
    )
  }

  function celdaExtra(tipoHabitacion: string, campo: 'montoActual' | 'montoPropuesto') {
    const key = `extra|${tipoHabitacion}|${campo}`
    const extra = extraDe(tipoHabitacion)
    const monto = campo === 'montoActual' ? extra?.montoActual ?? null : extra?.montoPropuesto ?? null

    if (editing === key) {
      return (
        <span className="inline-block">
          <input
            autoFocus
            className="w-24 border rounded px-1 py-0.5 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => guardarExtra(tipoHabitacion, campo)}
            onKeyDown={(e) => e.key === 'Enter' && guardarExtra(tipoHabitacion, campo)}
          />
          {errorDe(key)}
        </span>
      )
    }

    return (
      <button className="text-sm hover:underline" onClick={() => empezarEdicion(key, monto)}>
        {fmt(monto)}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tarifa.nombre}</h3>
        <div className="flex gap-1">
          {tarifa.canales.map((c) => (
            <span key={c} className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">
              {c}
            </span>
          ))}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="font-normal">Tipo de habitación</th>
            {PAX_COLUMNAS.map((p) => (
              <th key={p} className="font-normal text-center">
                {p} pax{showPropuesta ? ' (act. / prop.)' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIPOS_HABITACION.map((tipo) => (
            <tr key={tipo} className="border-t">
              <td className="py-1.5">{tipo}</td>
              {PAX_COLUMNAS.map((pax) =>
                paxHabilitado(tipo, pax) ? (
                  <td key={pax} className="text-center">
                    {celda(tipo, pax, 'montoActual')}
                    {showPropuesta && <span className="mx-1 text-gray-300">/</span>}
                    {showPropuesta && celda(tipo, pax, 'montoPropuesto')}
                  </td>
                ) : (
                  <td key={pax} className="text-center text-gray-300" title="Fuera de la capacidad de esta habitación">
                    —
                  </td>
                ),
              )}
            </tr>
          ))}
          <tr className="border-t text-gray-500">
            <td className="py-1.5">Persona extra</td>
            {PAX_COLUMNAS.map((pax) => (
              <td key={pax} className="text-center">
                {pax >= 4 &&
                  TIPOS_HABITACION.filter((t) => extraDe(t)).map((t) => (
                    <div key={t} className="flex items-center justify-center gap-1">
                      {celdaExtra(t, 'montoActual')}
                      {showPropuesta && <span className="text-gray-300">/</span>}
                      {showPropuesta && celdaExtra(t, 'montoPropuesto')}
                    </div>
                  ))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
