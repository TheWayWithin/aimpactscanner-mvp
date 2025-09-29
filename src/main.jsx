import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// CRITICAL FIX: Defer CSS import to prevent blocking LCP
// App.css is already preloaded in index.html, so React will use it when ready
import App from './App.jsx'
// import App from './AppNew.jsx' // Testing new conversion flow

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
