<Routes>
  <Route path="/" element={<LoadingPage />} />
  <Route path="/loading" element={<LoadingPage />} />

  <Route path="*" element={<Navigate to="/loading" replace />} />
</Routes>