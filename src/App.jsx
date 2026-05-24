import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppSettingsProvider } from './context/AppSettingsContext.jsx'
import PermissionFlowGate from './components/permissions/PermissionFlowGate.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import LoadingPage from './pages/auth/LoadingPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import SignupFlowPage from './pages/auth/SignupFlowPage.jsx'
import HomePage from './pages/main/HomePage.jsx'
import ClassPage from './pages/main/ClassPage.jsx'
import CreatePage from './pages/main/CreatePage.jsx'
import SearchPage from './pages/main/SearchPage.jsx'
import MyPage from './pages/main/MyPage.jsx'
import SettingsPage from './pages/main/SettingsPage.jsx'
import ProfilePage from './pages/main/ProfilePage.jsx'

function App() {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <HashRouter>
          <PermissionFlowGate />
          <Routes>
            <Route path="/" element={<Navigate to="/loading" replace />} />
            <Route path="/loading" element={<LoadingPage />} />

            <Route
              path="/login"
              element={
                <GuestRoute>
                  <AuthLayout>
                    <LoginPage />
                  </AuthLayout>
                </GuestRoute>
              }
            />

            <Route
              path="/auth/signup"
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <AuthLayout>
                    <SignupFlowPage />
                  </AuthLayout>
                </ProtectedRoute>
              }
            />

            <Route path="/onboarding" element={<Navigate to="/auth/signup" replace />} />

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/home" element={<HomePage />} />
              <Route path="/class" element={<ClassPage />} />
              <Route path="/create" element={<CreatePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/my" element={<MyPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/users/:userId" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/loading" replace />} />
          </Routes>
        </HashRouter>
      </AppSettingsProvider>
    </AuthProvider>
  )
}

export default App
