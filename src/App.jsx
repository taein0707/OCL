<HashRouter>
  <AuthProvider>
    <AppSettingsProvider>

      <PermissionFlowGate />

      <Routes>
        <Route path="/" element={<Navigate to="/loading" />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/home" element={<HomePage />} />
        </Route>

      </Routes>

    </AppSettingsProvider>
  </AuthProvider>
</HashRouter>