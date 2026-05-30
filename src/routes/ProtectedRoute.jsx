import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { firebaseUser, loading, onboardingComplete, profileStatus, profile } = useAuth()

  if (loading || profileStatus === 'loading') {
    return <div /> // iOS 흰 화면 방지
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  if (profileStatus === 'ready') {
    if (!onboardingComplete) {
      return <Navigate to="/auth/signup" replace />
    }

    if (profile?.isBanned) {
      return <Navigate to="/banned" replace />
    }

    const suspendedUntil = profile?.suspendedUntil?.toDate?.()
    if (suspendedUntil && suspendedUntil > new Date()) {
      return <Navigate to="/suspended" replace />
    }
  }

  return children
}