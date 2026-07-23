import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/index.css'

// El service worker se registra desde <UpdatePrompt/> (hook useRegisterSW),
// que además muestra el aviso de nueva versión sin forzar recarga.

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('No se encontró el elemento #root')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
