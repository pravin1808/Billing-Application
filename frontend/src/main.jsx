import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Disable mouse-wheel scrolling from changing values on all number inputs
window.addEventListener(
  'wheel',
  () => {
    if (
      document.activeElement &&
      document.activeElement.tagName === 'INPUT' &&
      document.activeElement.type === 'number'
    ) {
      document.activeElement.blur()
    }
  },
  { capture: true, passive: true }
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
