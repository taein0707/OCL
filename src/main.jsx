import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'

import { AuthProvider } from './context/AuthContext'
import { AppSettingsProvider } from './context/AppSettingsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🚨 순서 교정: AppSettingsProvider가 useAuth를 쓰기 때문에 AuthProvider가 가장 바깥에 있어야 합니다. */}
    <AuthProvider>
      <AppSettingsProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AppSettingsProvider>
    </AuthProvider>
  </React.StrictMode>,
)