import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

;(function () {
  const saved = localStorage.getItem('dp-theme')
  document.body.classList.add(saved === 'night' ? 'theme-night' : 'theme-day')
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
