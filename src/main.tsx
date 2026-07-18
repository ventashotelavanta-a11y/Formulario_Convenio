import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import MatrizApp from './matriz/MatrizApp'

const isMatriz = window.location.pathname.startsWith('/matriz-tarifas')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isMatriz ? <MatrizApp /> : <App />}</StrictMode>,
)
