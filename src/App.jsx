import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { AppSettingsProvider } from './context/AppSettingsContext'

import ProtectedRoute from './routes/ProtectedRoute'

import LoginPage from './pages/auth/LoginPage'
import LoadingPage from './pages/auth/LoadingPage'
import MainLayout from './layouts/MainLayout'

import HomePage from './pages/main/HomePage'

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppSettingsProvider>

          <Routes>

            <Route path="/" element={<Navigate to="/loading" />} />
            <Route path="/loading" element={<LoadingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <HomePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

          </Routes>

        </AppSettingsProvider>
      </AuthProvider>
    </HashRouter>
  )
}

export default App