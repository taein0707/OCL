import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'

import { AuthorCacheProvider } from './context/AuthorCacheContext'
import { AuthProvider } from './context/AuthContext'
import { AppSettingsProvider } from './context/AppSettingsContext'
import { initAdMob } from './services/ads.js'

initAdMob().catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* AuthorCacheProvider must wrap AuthProvider so AuthProvider can seed the cache */}
    <AuthorCacheProvider>
      <AuthProvider>
        <AppSettingsProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AppSettingsProvider>
      </AuthProvider>
    </AuthorCacheProvider>
  </React.StrictMode>,
)
