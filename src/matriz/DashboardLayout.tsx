import { useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import ChangePasswordModal from './ChangePasswordModal'

export type MatrizTab = 'matriz' | 'propuesta' | 'historial'

const TABS: { key: MatrizTab; label: string }[] = [
  { key: 'matriz', label: 'Matriz actual' },
  { key: 'propuesta', label: 'Propuesta de aumento' },
  { key: 'historial', label: 'Historial de ediciones' },
]

export default function DashboardLayout({
  active,
  onChangeTab,
  children,
}: {
  active: MatrizTab
  onChangeTab: (tab: MatrizTab) => void
  children: ReactNode
}) {
  const { user, logout } = useAuth()
  const [changingPassword, setChangingPassword] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo_avanta_principal.png" alt="Avanta Hotel & Villas" className="h-9" />
          <span className="font-semibold text-gray-700">Matriz de Tarifas</span>
        </div>
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChangeTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                active === tab.key ? 'bg-green text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{user?.nombre}</span>
          <button onClick={() => setChangingPassword(true)} className="text-green-dark font-medium">
            Cambiar contraseña
          </button>
          <button onClick={() => logout()} className="text-green-dark font-medium">
            Salir
          </button>
        </div>
      </header>
      <main className="p-6">{children}</main>
      {changingPassword && <ChangePasswordModal onClose={() => setChangingPassword(false)} />}
    </div>
  )
}
