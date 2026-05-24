import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

function LoadingPage() {
  const navigate = useNavigate()
  const { loading, isAuthenticated, onboardingComplete } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    if (!onboardingComplete) {
      navigate('/auth/signup', { replace: true })
      return
    }

    navigate('/home', { replace: true })
  }, [loading, isAuthenticated, onboardingComplete, navigate])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F6F6F6',
    }}>
      Loading...
    </div>
  )
}

export default LoadingPage
