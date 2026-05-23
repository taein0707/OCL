import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../../components/Logo.jsx'

const MIN_MS = 1000

function LoadingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, isAuthenticated, onboardingComplete, profileStatus, recoveryMessage, logout } = useAuth()
  const mountedAt = useRef(Date.now())

  useEffect(() => {
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
          state: { notice: notice || '세션을 다시 확인한 뒤 로그인해 주세요.' },
        })
        return
      }

      if (profileStatus !== 'ready') {
        navigate('/login', {
          replace: true,
          state: { notice: notice || '세션을 다시 확인한 뒤 로그인해 주세요.' },
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
      void go()
    }, wait)
    return () => clearTimeout(t)
  }, [loading, isAuthenticated, onboardingComplete, profileStatus, recoveryMessage, location.state, logout, navigate])

  return (
    <div className="flex min-h-[100svh] items-start justify-center px-4 py-10 sm:min-h-[100dvh] sm:items-center sm:px-6">
      <div className="neo-card flex w-full max-w-md flex-col items-center gap-6 bg-white/[0.92] px-6 py-10 text-center backdrop-blur sm:px-8 sm:py-12">
        <div className="rounded-[30px] border border-mono-200 bg-mono-100 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
          <Logo size="lg" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-[3px] border-mono-300 border-t-[var(--accent)] animate-spin" />
          <div>
            <p className="text-sm font-semibold text-mono-500">커뮤니티에 들어갈 준비를 하고 있어요</p>
            <p className="mt-1 text-xs font-medium text-mono-400">계정과 화면 상태를 안전하게 확인하는 중입니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingPage
