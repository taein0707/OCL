import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children, requireOnboarding = true }) {
  const { loading, isAuthenticated, onboardingComplete, profileStatus } = useAuth()
  const location = useLocation()

  if (loading || (isAuthenticated && profileStatus === 'loading')) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-transparent">
        <div className="h-10 w-10 rounded-full border-[3px] border-mono-300 border-t-[var(--accent)] animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (profileStatus === 'recovery') {
    return <Navigate to="/loading" replace />
  }

  if (profileStatus !== 'ready') {
    return <Navigate to="/loading" replace />
  }

  if (requireOnboarding && !onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

export default ProtectedRoute
