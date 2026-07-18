import { useState, type FormEvent } from 'react'
import { useAuth, ApiError } from './AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <img src="/logo_avanta_principal.png" alt="Avanta Hotel & Villas" className="h-12 mb-6" />
        <h1 className="text-xl font-semibold mb-1">Matriz de Tarifas</h1>
        <p className="text-sm text-gray-500 mb-6">Inicia sesión para continuar</p>

        <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <label className="block text-sm font-medium mb-1" htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
