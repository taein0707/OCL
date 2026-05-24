function App() {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <HashRouter>

          <PermissionFlowGate />

          <Routes>
            <Route path="/" element={<Navigate to="/loading" replace />} />
            <Route path="/loading" element={<LoadingPage />} />

            <Route path="/login" element={
              <GuestRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </GuestRoute>
            } />

            <Route path="/auth/signup" element={
              <ProtectedRoute requireOnboarding={false}>
                <AuthLayout>
                  <SignupFlowPage />
                </AuthLayout>
              </ProtectedRoute>
            } />

            <Route element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
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