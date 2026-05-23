import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../../components/Logo.jsx'
import SocialLoginButtons from '../../components/SocialLoginButtons.jsx'
import FieldError from '../../components/FieldError.jsx'

const panelClass =
  'neo-card w-full max-w-md bg-white/[0.92] px-6 py-8 backdrop-blur sm:px-8 sm:py-10'
const subtleButtonClass =
  'text-sm font-semibold text-mono-500 transition hover:text-ink'

// 로그인 실패가 "비밀번호 틀림 or 계정 없음" 에러인지 확인
function isCredentialError(code) {
  return (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loginWithApple } = useAuth()

  const [screen, setScreen] = useState('welcome')
  const [emailStep, setEmailStep] = useState('id') // 'id' | 'pw'
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  // 로그인 실패 후 "처음 방문이신가요?" 확인 단계
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [errors, setErrors] = useState({ id: '', pw: '', pwConfirm: '', general: '' })
  const [loading, setLoading] = useState(false)

  const entryNotice = useMemo(() => location.state?.notice || '', [location.state])
  const clearErrors = () => setErrors({ id: '', pw: '', pwConfirm: '', general: '' })
  const goToResolvedEntry = () => navigate('/loading', { replace: true })

  const handleOAuth = async (fn) => {
    clearErrors()
    setLoading(true)
    try {
      await fn()
      goToResolvedEntry()
    } catch (err) {
      setErrors((e) => ({ ...e, general: err.message || '로그인에 실패했습니다. 다시 시도해 주세요.' }))
    } finally {
      setLoading(false)
    }
  }

  // ID 단계: 형식 검증만 하고 즉시 비밀번호 단계로 (API 호출 없음)
  const handleIdCheck = (e) => {
    e.preventDefault()
    clearErrors()
    const idRegex = /^[A-Za-z0-9!@#$%^&*()_+=-]{4,20}$/
    if (!idRegex.test(id)) {
      setErrors((prev) => ({ ...prev, id: '아이디는 4~20자의 영문/숫자/특수문자여야 해요.' }))
      return
    }
    setPw('')
    setPwConfirm('')
    setNeedsConfirm(false)
    setEmailStep('pw')
  }

  // 비밀번호 단계:
  //   1차 시도 → signInWithEmailAndPassword
  //   실패(invalid-credential) → "처음이신가요?" 확인 단계로 전환
  //   2차 시도 → createUserWithEmailAndPassword
  //     성공 → 신규 계정
  //     email-already-in-use → 비밀번호 틀림 에러
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    clearErrors()

    if (pw.length < 6) {
      setErrors((prev) => ({ ...prev, pw: '비밀번호는 6자 이상이어야 해요.' }))
      return
    }

    setLoading(true)

    if (needsConfirm) {
      if (pw !== pwConfirm) {
        setErrors((prev) => ({ ...prev, pwConfirm: '비밀번호가 서로 달라요.' }))
        setLoading(false)
        return
      }
      try {
        await signupWithEmail(id, pw)
        goToResolvedEntry()
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          general:
            err.code === 'auth/email-already-in-use'
              ? '비밀번호가 일치하지 않습니다.'
              : err.message || '실패했습니다. 다시 시도해 주세요.',
        }))
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      await loginWithEmail(id, pw)
      goToResolvedEntry()
    } catch (err) {
      if (isCredentialError(err.code)) {
        setNeedsConfirm(true)
        setPwConfirm('')
        setErrors((prev) => ({
          ...prev,
          general: '처음 방문이신가요? 비밀번호를 한 번 더 입력하면 계정이 만들어져요.',
        }))
      } else {
        setErrors((prev) => ({ ...prev, general: err.message || '실패했습니다. 다시 시도해 주세요.' }))
      }
    } finally {
      setLoading(false)
    }
  }

  const goBackToId = () => {
    clearErrors()
    setPw('')
    setPwConfirm('')
    setNeedsConfirm(false)
    setEmailStep('id')
  }

  // ── 웰컴 ──────────────────────────────────────────────────────────────
  if (screen === 'welcome') {
    return (
      <div className={`${panelClass} flex flex-col gap-8 text-center animate-[slideUpFade_0.3s_ease-out]`}>
        <div className="flex flex-col items-center gap-5">
          <div className="rounded-[30px] border border-mono-200 bg-mono-100 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <Logo size="lg" />
          </div>
          <div className="flex flex-col gap-3">
            <span className="mx-auto rounded-full border border-mono-200 bg-mono-100 px-3 py-1 text-[11px] font-semibold text-mono-600">
              teen community
            </span>
            <div>
              <h1 className="sys-text text-3xl font-black text-ink">청소년을 위한 커뮤니티</h1>
              <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-relaxed text-mono-500">
                학교 얘기부터 취향 얘기까지, 지금 보고 싶은 글을 바로 이어서 볼 수 있어요.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <FieldError message={entryNotice || errors.general} />
          <button
            type="button"
            className="neo-btn w-full"
            onClick={() => { clearErrors(); setScreen('methods') }}
          >
            들어가기
          </button>
        </div>
      </div>
    )
  }

  // ── 로그인 방법 선택 ──────────────────────────────────────────────────
  if (screen === 'methods') {
    return (
      <div className={`${panelClass} flex flex-col gap-6 animate-[slideUpFade_0.3s_ease-out]`}>
        <div className="flex flex-col gap-4 text-center">
          <div className="mx-auto rounded-[28px] border border-mono-200 bg-mono-100 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <Logo size="md" />
          </div>
          <div>
            <h1 className="sys-text text-2xl font-black text-ink">어떻게 시작할까요?</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm font-semibold text-mono-500">
              편한 방식으로 시작하고, 처음이면 바로 계정을 만들 수 있어요.
            </p>
          </div>
        </div>
        <FieldError message={errors.general} />
        <SocialLoginButtons
          disabled={loading}
          onGoogle={() => handleOAuth(loginWithGoogle)}
          onApple={() => handleOAuth(loginWithApple)}
          onEmail={() => {
            clearErrors()
            setId('')
            setPw('')
            setPwConfirm('')
            setNeedsConfirm(false)
            setEmailStep('id')
            setScreen('email')
          }}
        />
        <button
          type="button"
          className={subtleButtonClass}
          onClick={() => { clearErrors(); setScreen('welcome') }}
        >
          뒤로
        </button>
      </div>
    )
  }

  // ── 이메일: 아이디 입력 ──────────────────────────────────────────────
  if (screen === 'email' && emailStep === 'id') {
    return (
      <div className={`${panelClass} animate-[slideUpFade_0.3s_ease-out]`}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-[24px] border border-mono-200 bg-mono-100 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <Logo size="md" />
            </div>
            <div>
              <h1 className="sys-text text-2xl font-black text-ink">아이디 입력</h1>
              <p className="mx-auto mt-2 max-w-xs text-sm font-semibold text-mono-500">
                처음이라면 바로 계정을 만들어 드릴게요.
              </p>
            </div>
          </div>
          <form onSubmit={handleIdCheck} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-mono-500">아이디</label>
              <input
                className="neo-input"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="4~20자"
                autoComplete="username"
                autoFocus
              />
              <FieldError message={errors.id} />
            </div>
            <FieldError message={errors.general} />
            <button type="submit" disabled={!id.trim()} className="neo-btn w-full">
              계속
            </button>
          </form>
          <button
            type="button"
            className={subtleButtonClass}
            onClick={() => { clearErrors(); setScreen('methods') }}
          >
            뒤로
          </button>
        </div>
      </div>
    )
  }

  // ── 이메일: 비밀번호 입력 ────────────────────────────────────────────
  return (
    <div className={`${panelClass} animate-[slideUpFade_0.3s_ease-out]`}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-[24px] border border-mono-200 bg-mono-100 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <Logo size="md" />
          </div>
          <div>
            <span className="inline-block rounded-full border border-mono-200 bg-mono-100 px-3 py-1 text-xs font-black text-mono-600">
              @{id}
            </span>
            <h1 className="sys-text mt-3 text-2xl font-black text-ink">
              {needsConfirm ? '처음이신가요?' : '로그인'}
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-sm font-semibold text-mono-500">
              {needsConfirm
                ? '비밀번호를 한 번 더 입력하면 계정이 만들어져요.'
                : '비밀번호를 입력해 주세요.'}
            </p>
          </div>
        </div>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-mono-500">비밀번호</label>
            <input
              type="password"
              className="neo-input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="6자 이상"
              autoComplete={needsConfirm ? 'new-password' : 'current-password'}
              autoFocus={!needsConfirm}
            />
            <FieldError message={errors.pw} />
          </div>
          {needsConfirm && (
            <div className="flex flex-col gap-2 animate-[slideUpFade_0.2s_ease-out]">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-mono-500">
                비밀번호 재확인
              </label>
              <input
                type="password"
                className="neo-input"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="동일하게 입력"
                autoComplete="new-password"
                autoFocus
              />
              <FieldError message={errors.pwConfirm} />
            </div>
          )}
          <FieldError message={errors.general} />
          <button type="submit" disabled={loading} className="neo-btn w-full">
            {loading ? '처리 중...' : needsConfirm ? '계정 만들기' : '로그인'}
          </button>
        </form>
        <button type="button" className={subtleButtonClass} onClick={goBackToId}>
          뒤로
        </button>
      </div>
    </div>
  )
}

export default LoginPage
