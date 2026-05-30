import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { firebaseUser, loading, onboardingComplete, profileStatus } = useAuth()

  if (loading || profileStatus === 'loading') {
    return <div /> // iOS 흰 화면 방지
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  if (profileStatus === 'ready' && !onboardingComplete) {
    return <Navigate to="/auth/signup" replace />
  }

  return children
}