import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'

// 🚨 [핵심 중요] 원래 기능들이 필요로 하는 데이터 공급 장치(Context Providers)들을 불러옵니다.
import { AuthProvider } from './context/AuthContext'
import { AppSettingsProvider } from './context/AppSettingsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🔥 기존에 기능들이 정상 작동하도록 필요한 모든 Provider들을 순서대로 다시 감싸줍니다. */}
    <AppSettingsProvider>
      <AuthProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AuthProvider>
    </AppSettingsProvider>
  </React.StrictMode>,
)