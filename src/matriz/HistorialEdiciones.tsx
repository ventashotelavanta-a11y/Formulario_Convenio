import { useEffect, useState } from 'react'
import { api, ApiError } from './api'

interface Edicion {
  id: number
  anio: number
  estado: 'borrador' | 'activa' | 'archivada'
  aumentoDefaultMxn: number
  fechaPublicacion: string | null
}

function descargar(nombre: string, contenido: unknown) {
  const blob = new Blob([JSON.stringify(contenido, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

export default function HistorialEdiciones() {
  const [ediciones, setEdiciones] = useState<Edicion[]>([])
  const [publicando, setPublicando] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    setEdiciones(await api.get<Edicion[]>('/matriz/ediciones'))
  }

  useEffect(() => {
    cargar()
  }, [])

  async function publicar(edicionId: number) {
    setPublicando(edicionId)
    setError(null)
    try {
      const { tarifasJson, tarifasCotizadorJson } = await api.post<{
        tarifasJson: unknown
        tarifasCotizadorJson: unknown
      }>('/matriz/publicar', { edicionId })
      descargar('tarifas.json', tarifasJson)
      descargar('tarifas-cotizador.json', tarifasCotizadorJson)
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo publicar la edición')
    } finally {
      setPublicando(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="font-normal">Año</th>
            <th className="font-normal">Estado</th>
            <th className="font-normal">Aumento default</th>
            <th className="font-normal">Publicada</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ediciones.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-2">{e.anio}</td>
              <td className="capitalize">{e.estado}</td>
              <td>${e.aumentoDefaultMxn.toLocaleString('es-MX')}</td>
              <td>{e.fechaPublicacion ? new Date(e.fechaPublicacion).toLocaleDateString('es-MX') : '—'}</td>
              <td className="text-right">
                {e.estado === 'borrador' && (
                  <button
                    onClick={() => publicar(e.id)}
                    disabled={publicando === e.id}
                    className="bg-green text-white rounded-lg px-3 py-1 text-xs disabled:opacity-50"
                  >
                    {publicando === e.id ? 'Publicando…' : 'Publicar edición'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      <p className="text-xs text-gray-500 mt-3">
        Publicar descarga <code>tarifas.json</code> y <code>tarifas-cotizador.json</code> — colócalos manualmente en
        <code> convenios-avanta-2026/api/</code> y <code>cotizacion-avanta/api/</code> respectivamente.
      </p>
    </div>
  )
}
