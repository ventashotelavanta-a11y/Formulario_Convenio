import { useEffect, useState } from 'react'
import { api } from './api'
import TarifaCard, { type Tarifa } from './TarifaCard'
import NuevoModuloModal from './NuevoModuloModal'

// ponytail: hardcoded — solo existe la edición 2026 (id 1) hasta que se cree la de 2027.
// Cuando exista más de una edición 'borrador', reemplazar por un selector que lea
// GET /api/matriz/ediciones y tome la de estado 'borrador' más reciente.
const EDICION_ACTIVA_ID = 1

export default function MatrizActual() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filtroCanal, setFiltroCanal] = useState<string | null>(null)

  async function cargar() {
    const data = await api.get<Tarifa[]>(`/matriz/tarifas?edicionId=${EDICION_ACTIVA_ID}`)
    setTarifas(data)
  }

  useEffect(() => {
    cargar()
  }, [])

  const canales = Array.from(new Set(tarifas.flatMap((t) => t.canales))).sort()
  const visibles = filtroCanal ? tarifas.filter((t) => t.canales.includes(filtroCanal)) : tarifas

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroCanal(null)}
            className={`text-sm px-3 py-1 rounded-full ${!filtroCanal ? 'bg-green text-white' : 'bg-white border'}`}
          >
            Todos
          </button>
          {canales.map((c) => (
            <button
              key={c}
              onClick={() => setFiltroCanal(c)}
              className={`text-sm px-3 py-1 rounded-full ${filtroCanal === c ? 'bg-green text-white' : 'bg-white border'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-green text-white rounded-lg px-4 py-2 text-sm font-medium">
          + Nuevo módulo
        </button>
      </div>

      <div className="grid gap-4">
        {visibles.map((t) => (
          <TarifaCard key={t.id} tarifa={t} showPropuesta={false} onCellSaved={cargar} />
        ))}
      </div>

      {modalOpen && (
        <NuevoModuloModal
          edicionId={EDICION_ACTIVA_ID}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false)
            cargar()
          }}
        />
      )}
    </div>
  )
}
