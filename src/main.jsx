import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Capacitor WebView에서 잡히지 않은 오류로 인한 흰 화면을 방지한다.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[window.error]', event?.error || event?.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[unhandledrejection]', event?.reason)
  })
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
