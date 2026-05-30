import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  hasCompletedFirstRunPermissionFlow,
  markFirstRunPermissionFlowCompleted,
  requestNotificationPermission,
} from '../../utils/permissions.js'
import { isNative } from '../../utils/platform.js'

function LoadingPage() {
  const navigate = useNavigate()
  const { loading, isAuthenticated, onboardingComplete, profileStatus } = useAuth()

  useEffect(() => {
    if (loading) return
    if (profileStatus === 'loading') return

    const run = async () => {
      if (!isAuthenticated || profileStatus === 'recovery') {
        navigate('/login', { replace: true })
        return
      }

      if (!onboardingComplete) {
        navigate('/auth/signup', { replace: true })
        return
      }

      if (isNative()) {
        const done = await hasCompletedFirstRunPermissionFlow()
        if (!done) {
          try {
            await requestNotificationPermission()
          } finally {
            await markFirstRunPermissionFlowCompleted()
          }
        }
      }

      navigate('/home', { replace: true })
    }

    void run()
  }, [loading, isAuthenticated, onboardingComplete, profileStatus, navigate])

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
