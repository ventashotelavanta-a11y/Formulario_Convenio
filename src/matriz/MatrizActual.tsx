import { useEffect, useState } from 'react'
import { api } from './api'
import TarifaCard, { type Tarifa } from './TarifaCard'
import NuevoModuloModal from './NuevoModuloModal'
import EditarModuloModal from './EditarModuloModal'

// ponytail: hardcoded — solo existe la edición 2026 (id 1) hasta que se cree la de 2027.
// Cuando exista más de una edición 'borrador', reemplazar por un selector que lea
// GET /api/matriz/ediciones y tome la de estado 'borrador' más reciente.
const EDICION_ACTIVA_ID = 1

export default function MatrizActual() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filtroCanal, setFiltroCanal] = useState<string | null>(null)
  const [editando, setEditando] = useState<Tarifa | null>(null)
  const [anio, setAnio] = useState<number | null>(null)
  const [imprimiendo, setImprimiendo] = useState(false)
  const [errorPdf, setErrorPdf] = useState<string | null>(null)

  async function cargar() {
    const [data, ediciones] = await Promise.all([
      api.get<Tarifa[]>(`/matriz/tarifas?edicionId=${EDICION_ACTIVA_ID}`),
      api.get<{ id: number; anio: number }[]>('/matriz/ediciones'),
    ])
    setTarifas(data)
    setAnio(ediciones.find((e) => e.id === EDICION_ACTIVA_ID)?.anio ?? null)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function imprimirPdf() {
    setImprimiendo(true)
    setErrorPdf(null)
    try {
      const res = await fetch('/api/matriz/generar-pdf-tarifario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anio,
          tarifas: tarifas.map((t) => ({ nombre: t.nombre, valores: t.valores, personaExtra: t.personaExtra })),
        }),
      })
      const resp = await res.json()
      if (!res.ok || !resp.success) throw new Error(resp.error || `Error al generar el PDF: ${res.status}`)
      const blob = new Blob([Uint8Array.from(atob(resp.pdfBase64), (c) => c.charCodeAt(0))], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Tarifario_${anio}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setErrorPdf(err instanceof Error ? err.message : 'No se pudo generar el PDF')
    } finally {
      setImprimiendo(false)
    }
  }

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
        <div className="flex items-center gap-2">
          {errorPdf && <span className="text-red-500 text-xs">{errorPdf}</span>}
          <button
            onClick={imprimirPdf}
            disabled={imprimiendo || !anio}
            className="bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {imprimiendo ? 'Generando…' : 'Imprimir PDF'}
          </button>
          <button onClick={() => setModalOpen(true)} className="bg-green text-white rounded-lg px-4 py-2 text-sm font-medium">
            + Nuevo módulo
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {visibles.map((t) => (
          <TarifaCard key={t.id} tarifa={t} showPropuesta={false} onCellSaved={cargar} onEdit={() => setEditando(t)} />
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

      {editando && (
        <EditarModuloModal
          tarifaId={editando.id}
          nombreActual={editando.nombre}
          canalIdsActuales={editando.canalIds}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null)
            cargar()
          }}
          onDeleted={() => {
            setEditando(null)
            cargar()
          }}
        />
      )}
    </div>
  )
}
