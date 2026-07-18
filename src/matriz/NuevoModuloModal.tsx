import { useEffect, useState, type FormEvent } from 'react'
import { api } from './api'

interface Canal {
  id: number
  nombre: string
}

export default function NuevoModuloModal({
  edicionId,
  onClose,
  onCreated,
}: {
  edicionId: number
  onClose: () => void
  onCreated: () => void
}) {
  const [canales, setCanales] = useState<Canal[]>([])
  const [nombre, setNombre] = useState('')
  const [canalIds, setCanalIds] = useState<number[]>([])
  const [nuevoCanal, setNuevoCanal] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get<Canal[]>('/matriz/canales').then(setCanales)
  }, [])

  function toggleCanal(id: number) {
    setCanalIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  async function agregarCanal() {
    if (!nuevoCanal.trim()) return
    const canal = await api.post<Canal>('/matriz/canales', { nombre: nuevoCanal.trim() })
    setCanales((prev) => [...prev, canal])
    setCanalIds((prev) => [...prev, canal.id])
    setNuevoCanal('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || canalIds.length === 0) return
    setSaving(true)
    await api.post('/matriz/tarifas', { edicionId, nombre: nombre.trim(), canalIds })
    setSaving(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="font-semibold text-lg mb-4">Nuevo módulo de tarifa</h2>

        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="ej. Airbnb Sin Desayuno"
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

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-green text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Creando…' : 'Crear módulo'}
          </button>
        </div>
      </form>
    </div>
  )
}
