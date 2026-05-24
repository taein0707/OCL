import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

function LoadingPage() {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    navigate('/home', { replace: true })
  }, [loading, isAuthenticated, navigate])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F6F6F6',
      fontSize: 16,
    }}>
      로딩...
    </div>
  )
}

export default LoadingPage