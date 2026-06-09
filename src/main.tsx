import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './app/App'
import './styles/index.css'

// Service worker (PWA): se auto-actualiza en segundo plano.
registerSW({ immediate: true })

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
