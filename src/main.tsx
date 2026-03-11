import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applyThemeToDocument, resolveInitialTheme } from '@/hooks/useTheme'

applyThemeToDocument(resolveInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
