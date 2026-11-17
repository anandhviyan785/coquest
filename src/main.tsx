import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import './index.css'
import { initTheme } from './lib/theme'
import { AppProvider } from './state/AppContext'

initTheme()

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />

        <Analytics />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
)
