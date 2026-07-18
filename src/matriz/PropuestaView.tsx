import { useEffect, useState } from 'react'
import { api } from './api'
import TarifaCard, { type Tarifa } from './TarifaCard'

// ponytail: same simplification as MatrizActual.tsx — single hardcoded edición until 2027 exists.
const EDICION_ACTIVA_ID = 1

interface Edicion {
  id: number
  anio: number
  aumentoDefaultMxn: number
}

export default function PropuestaView() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [edicion, setEdicion] = useState<Edicion | null>(null)
  const [aumentoDraft, setAumentoDraft] = useState('')

  async function cargar() {
    const [tarifasData, ediciones] = await Promise.all([
      api.get<Tarifa[]>(`/matriz/tarifas?edicionId=${EDICION_ACTIVA_ID}`),
      api.get<Edicion[]>('/matriz/ediciones'),
    ])
    setTarifas(tarifasData)
    const actual = ediciones.find((e) => e.id === EDICION_ACTIVA_ID) ?? null
    setEdicion(actual)
    if (actual) setAumentoDraft(String(actual.aumentoDefaultMxn))
  }

  useEffect(() => {
    cargar()
  }, [])

  async function guardarAumento() {
    const monto = Number(aumentoDraft)
    if (Number.isNaN(monto) || !edicion) return
    await api.put('/matriz/ediciones', { id: edicion.id, aumentoDefaultMxn: monto })
    cargar()
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex items-center gap-3">
        <label className="text-sm font-medium">Aumento global (MXN)</label>
        <input
          value={aumentoDraft}
          onChange={(e) => setAumentoDraft(e.target.value)}
          className="w-24 border rounded px-2 py-1 text-sm"
        />
        <button onClick={guardarAumento} className="bg-green text-white rounded-lg px-3 py-1 text-sm">
          Aplicar a todas las celdas
        </button>
        <p className="text-xs text-gray-500">
          Se aplica a toda celda sin ajuste manual propio (columna "propuesta" en blanco).
        </p>
      </div>

      <div className="grid gap-4">
        {tarifas.map((t) => (
          <TarifaCard key={t.id} tarifa={t} showPropuesta onCellSaved={cargar} />
        ))}
      </div>
    </div>
  )
}
