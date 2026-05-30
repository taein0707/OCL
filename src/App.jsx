import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import GuestRoute from './components/GuestRoute'

import LoadingPage from './pages/auth/LoadingPage'
import LoginPage from './pages/auth/LoginPage'
import SignupFlowPage from './pages/auth/SignupFlowPage'

import HomePage from './pages/main/HomePage'
import SearchPage from './pages/main/SearchPage'
import CreatePage from './pages/main/CreatePage'
import ClassPage from './pages/main/ClassPage'
import MyPage from './pages/main/MyPage'
import ProfilePage from './pages/main/ProfilePage'
import SettingsPage from './pages/main/SettingsPage'
import PostDetailPage from './pages/main/PostDetailPage'
import BannedPage from './pages/main/BannedPage'
import SupportPage from './pages/main/SupportPage'

function App() {
  return (
    <Routes>
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
          <AuthLayout>
            <SignupFlowPage />
          </AuthLayout>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="class" element={<ClassPage />} />
        <Route path="my" element={<MyPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="users/:userId" element={<ProfilePage />} />
        <Route path="post/:postId" element={<PostDetailPage />} />
        <Route path="support" element={<SupportPage />} />
      </Route>

      {/* Public routes — accessible without auth (banned users need support) */}
      <Route path="/banned" element={<BannedPage type="permanent" />} />
      <Route path="/suspended" element={<BannedPage type="temporary" />} />
      <Route path="/support" element={<SupportPage />} />

      <Route path="*" element={<Navigate to="/loading" replace />} />
    </Routes>
  )
}

export default App
