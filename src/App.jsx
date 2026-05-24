import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext.jsx'
import { AppSettingsProvider } from './context/AppSettingsContext.jsx'

import PermissionFlowGate from './components/permissions/PermissionFlowGate.jsx'

import LoadingPage from './pages/auth/LoadingPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'

import MainLayout from './layouts/MainLayout.jsx'
import HomePage from './pages/main/HomePage.jsx'

import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppSettingsProvider>

          <PermissionFlowGate />

          <Routes>
            <Route path="/" element={<Navigate to="/loading" replace />} />
            <Route path="/loading" element={<LoadingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/home" element={<HomePage />} />
            </Route>

          </Routes>

        </AppSettingsProvider>
      </AuthProvider>
    </HashRouter>
  )
}

export default App