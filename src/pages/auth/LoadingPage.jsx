console.log('🔥 LOADING PAGE')
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../../components/Logo.jsx'

const MIN_MS = 1000

function LoadingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    loading,
    isAuthenticated,
    onboardingComplete,
    profileStatus,
    recoveryMessage,
    logout,
  } = useAuth()

  const mountedAt = useRef(Date.now())

  useEffect(() => {
    // 🔥 안전장치: loading이 너무 오래 지속되면 강제 진행
    const safety = setTimeout(() => {
      console.warn('Loading timeout fallback triggered')
      navigate('/login', { replace: true })
    }, 8000)

    if (loading) return

    const go = async () => {
      const notice = location.state?.notice || recoveryMessage

      if (!isAuthenticated) {
        navigate('/login', {
          replace: true,
          state: notice ? { notice } : undefined,
        })
        return
      }

      if (profileStatus === 'recovery') {
        await logout().catch(() => {})
        navigate('/login', {
          replace: true,
          state: { notice: notice || '세션이 만료되었습니다.' },
        })
        return
      }

      if (profileStatus !== 'ready') {
        navigate('/login', {
          replace: true,
          state: { notice: notice || '프로필을 불러올 수 없습니다.' },
        })
        return
      }

      if (!onboardingComplete) {
        navigate('/auth/signup', { replace: true })
        return
      }

      navigate('/home', { replace: true })
    }

    const wait = Math.max(0, MIN_MS - (Date.now() - mountedAt.current))

    const t = setTimeout(() => {
      go()
    }, wait)

    return () => {
      clearTimeout(t)
      clearTimeout(safety)
    }
  }, [
    loading,
    isAuthenticated,
    onboardingComplete,
    profileStatus,
    recoveryMessage,
    location.state,
    logout,
    navigate,
  ])

  return (
    <div className="flex min-h-[100svh] items-start justify-center px-4 py-10 sm:items-center">
      <div className="neo-card flex w-full max-w-md flex-col items-center gap-6 bg-white/[0.92] px-6 py-10 text-center">
        <div className="rounded-[30px] border border-mono-200 bg-mono-100 px-5 py-4">
          <Logo size="lg" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-[3px] border-mono-300 border-t-[var(--accent)] animate-spin" />
          <p className="text-sm font-semibold text-mono-500">
            커뮤니티를 준비하고 있어요
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingPage