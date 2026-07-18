import { useState } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import LoginScreen from './LoginScreen'
import DashboardLayout, { type MatrizTab } from './DashboardLayout'
import MatrizActual from './MatrizActual'
import PropuestaView from './PropuestaView'
import HistorialEdiciones from './HistorialEdiciones'

function MatrizAppInner() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<MatrizTab>('matriz')

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>
  if (!user) return <LoginScreen />

  return (
    <DashboardLayout active={tab} onChangeTab={setTab}>
      {tab === 'matriz' && <MatrizActual />}
      {tab === 'propuesta' && <PropuestaView />}
      {tab === 'historial' && <HistorialEdiciones />}
    </DashboardLayout>
  )
}

export default function MatrizApp() {
  return (
    <AuthProvider>
      <MatrizAppInner />
    </AuthProvider>
  )
}
