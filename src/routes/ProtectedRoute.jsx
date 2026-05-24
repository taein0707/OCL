import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { firebaseUser, loading } = useAuth()

  if (loading) {
    return <div /> // 💥 iOS 흰 화면 방지 핵심
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  return children
}