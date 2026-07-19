import { useState, type FormEvent } from 'react'
import { api, mensajeError } from './api'

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide con la nueva contraseña')
      return
    }

    setSaving(true)
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword })
      setSuccess(true)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cambiar la contraseña'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h2 className="font-semibold text-lg mb-4">Cambiar contraseña</h2>

        {success ? (
          <>
            <p className="text-sm text-gray-600 mb-4">Tu contraseña se actualizó correctamente.</p>
            <div className="flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm bg-green text-white rounded-lg">
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <label className="block text-sm font-medium mb-1">Contraseña actual</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-green text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
