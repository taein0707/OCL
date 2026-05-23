import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function GuestRoute({ children }) {
  const { loading, isAuthenticated, onboardingComplete, profileStatus } = useAuth()

  if (loading || (isAuthenticated && profileStatus === 'loading')) {
    return null
  }

  if (isAuthenticated && profileStatus === 'recovery') {
    return <Navigate to="/loading" replace />
  }

  if (isAuthenticated && profileStatus === 'ready' && onboardingComplete) {
    return <Navigate to="/home" replace />
  }

  if (isAuthenticated && profileStatus === 'ready' && !onboardingComplete) {
    return <Navigate to="/auth/signup" replace />
  }

  return children
}

export default GuestRoute
