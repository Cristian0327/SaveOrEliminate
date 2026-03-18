import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'

// Ignore runtime errors injected by browser extensions so game errors remain visible.
const isExtensionScript = (source?: string | null) =>
  !!source && (
    source.startsWith('chrome-extension://') ||
    source.startsWith('opera-extension://') ||
    source.includes('webpage_content_reporter.js')
  )

window.addEventListener(
  'error',
  (event) => {
    if (isExtensionScript(event.filename)) {
      event.preventDefault()
    }
  },
  true,
)

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason ?? '')
  if (reason.includes('chrome-extension://') || reason.includes('opera-extension://')) {
    event.preventDefault()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
