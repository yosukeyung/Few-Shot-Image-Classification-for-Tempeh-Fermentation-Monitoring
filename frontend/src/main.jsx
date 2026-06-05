import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Initialize theme on load
const theme = localStorage.getItem('theme') || 'dark'
if (theme === 'light') {
  document.body.classList.add('light-theme')
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('light')
} else {
  document.body.classList.remove('light-theme')
  document.documentElement.classList.remove('light')
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
