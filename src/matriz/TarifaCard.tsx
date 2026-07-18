import { useState } from 'react'
import { api } from './api'

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

  function valorDe(tipoHabitacion: string, pax: number) {
    return tarifa.valores.find((v) => v.tipoHabitacion === tipoHabitacion && v.pax === pax) ?? null
  }

  function extraDe(tipoHabitacion: string) {
    return tarifa.personaExtra.find((e) => e.tipoHabitacion === tipoHabitacion) ?? null
  }

  async function guardarCelda(tipoHabitacion: string, pax: number, campo: 'montoActual' | 'montoPropuesto') {
    const nuevoMonto = draft.trim() === '' ? null : Number(draft)
    if (draft.trim() !== '' && Number.isNaN(nuevoMonto)) return setEditing(null)

    const actual = valorDe(tipoHabitacion, pax)
    await api.put('/matriz/tarifa-valores', {
      tarifaId: tarifa.id,
      tipoHabitacion,
      pax,
      montoActual: campo === 'montoActual' ? nuevoMonto : actual?.montoActual ?? null,
      montoPropuesto: campo === 'montoPropuesto' ? nuevoMonto : actual?.montoPropuesto ?? null,
    })
    setEditing(null)
    onCellSaved()
  }

  function celda(tipoHabitacion: string, pax: number, campo: 'montoActual' | 'montoPropuesto') {
    const key = `${tipoHabitacion}|${pax}|${campo}`
    const valor = valorDe(tipoHabitacion, pax)
    const monto = campo === 'montoActual' ? valor?.montoActual ?? null : valor?.montoPropuesto ?? null

    if (editing === key) {
      return (
        <input
          autoFocus
          className="w-24 border rounded px-1 py-0.5 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => guardarCelda(tipoHabitacion, pax, campo)}
          onKeyDown={(e) => e.key === 'Enter' && guardarCelda(tipoHabitacion, pax, campo)}
        />
      )
    }

    return (
      <button
        className="text-sm hover:underline"
        onClick={() => {
          setEditing(key)
          setDraft(monto === null ? '' : String(monto))
        }}
      >
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
                    <span key={t} className="block">
                      {fmt(extraDe(t)!.montoActual)}
                    </span>
                  ))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
