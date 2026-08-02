import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeError } from './api'

interface Canal {
  id: number
  nombre: string
}

export default function EditarModuloModal({
  tarifaId,
  nombreActual,
  canalIdsActuales,
  onClose,
  onSaved,
  onDeleted,
}: {
  tarifaId: number
  nombreActual: string
  canalIdsActuales: number[]
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}) {
  const [canales, setCanales] = useState<Canal[]>([])
  const [nombre, setNombre] = useState(nombreActual)
  const [canalIds, setCanalIds] = useState<number[]>(canalIdsActuales)
  const [nuevoCanal, setNuevoCanal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canalError, setCanalError] = useState<string | null>(null)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [borrando, setBorrando] = useState(false)

  useEffect(() => {
    api.get<Canal[]>('/matriz/canales').then(setCanales)
  }, [])

  function toggleCanal(id: number) {
    setCanalIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  async function agregarCanal() {
    if (!nuevoCanal.trim()) return
    try {
      const canal = await api.post<Canal>('/matriz/canales', { nombre: nuevoCanal.trim() })
      setCanales((prev) => [...prev, canal])
      setCanalIds((prev) => [...prev, canal.id])
      setNuevoCanal('')
      setCanalError(null)
    } catch (err) {
      setCanalError(mensajeError(err))
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || canalIds.length === 0) return
    setSaving(true)
    try {
      await api.put('/matriz/tarifas', { id: tarifaId, nombre: nombre.trim(), canalIds })
      setError(null)
      onSaved()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setSaving(false)
    }
  }

  async function eliminar() {
    setBorrando(true)
    try {
      await api.del(`/matriz/tarifas?id=${tarifaId}`)
      onDeleted()
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar el módulo'))
      setBorrando(false)
      setConfirmandoBorrado(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="font-semibold text-lg mb-4">Editar módulo de tarifa</h2>

        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          required
        />

        <label className="block text-sm font-medium mb-1">Canales</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {canales.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => toggleCanal(c.id)}
              className={`text-sm rounded-full px-3 py-1 border ${
                canalIds.includes(c.id) ? 'bg-green text-white border-green' : 'text-gray-600'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={nuevoCanal}
            onChange={(e) => setNuevoCanal(e.target.value)}
            placeholder="Agregar canal nuevo"
            className="flex-1 border rounded-lg px-3 py-1 text-sm"
          />
          <button type="button" onClick={agregarCanal} className="text-sm font-medium text-green-dark">
            + Canal
          </button>
        </div>
        {canalError && <div className="text-red-500 text-xs mb-4">{canalError}</div>}

        <div className="border-t pt-4 mb-4">
          {!confirmandoBorrado ? (
            <button
              type="button"
              onClick={() => setConfirmandoBorrado(true)}
              className="text-sm font-medium text-red-600"
            >
              Eliminar módulo
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">
                ¿Eliminar "{nombreActual}" y todos sus valores? Esta acción no se puede deshacer.
              </span>
              <button
                type="button"
                onClick={eliminar}
                disabled={borrando}
                className="text-sm font-medium text-white bg-red-600 rounded-lg px-3 py-1 disabled:opacity-50 whitespace-nowrap"
              >
                {borrando ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button type="button" onClick={() => setConfirmandoBorrado(false)} className="text-sm text-gray-600">
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end items-center gap-2">
          {error && <div className="text-red-500 text-xs mr-auto">{error}</div>}
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600">
            Cerrar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-green text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
