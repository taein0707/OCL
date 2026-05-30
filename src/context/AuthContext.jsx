import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { seedAuthor } from './AuthorCacheContext.jsx'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  browserPopupRedirectResolver,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from 'firebase/auth'
import { auth, db } from '../firebase/index.js'
import { doc, onSnapshot } from 'firebase/firestore'
import { isNative, isIOS } from '../utils/platform.js'
import {
  getUserProfile,
  ensureUserProfile,
  saveUserProfile,
  uploadUserProfilePhoto,
  removeUserProfilePhoto,
  logUserChange,
} from '../services/userProfile.js'
import { DEFAULT_APP_SETTINGS } from '../constants/appSettings.js'

// ─── Google Web Client ID ────────────────────────────────────────────────────
// Firebase Console → 프로젝트 설정 → 일반 → OAuth 2.0 Web Client ID
const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || ''

// ─── Native cancel detection (strict — do NOT use broad string matching) ─────
function isUserCancelledGoogle(e) {
  const code = String(e?.code ?? e?.errorCode ?? '')
  const msg = String(e?.message ?? '')
  // Android Google Sign-In: 12501 = SIGN_IN_CANCELLED (user pressed back/cancel)
  // @capgo/capacitor-social-login maps this to specific messages
  return (
    code === '12501' ||
    msg === 'User cancelled the sign-in flow.' ||
    msg === 'The user canceled the sign-in flow.' ||
    msg === 'Sign in action cancelled'
  )
}

function isUserCancelledApple(e) {
  const code = String(e?.code ?? e?.errorCode ?? '')
  const msg = String(e?.message ?? '')
  // iOS Apple Sign-In: 1001 = ASAuthorizationErrorCanceled
  return (
    code === '1001' ||
    code === 'ASAuthorizationErrorCanceled' ||
    msg.includes('AuthorizationError error 1001') ||
    msg === 'User cancelled Apple Sign In'
  )
}
// ────────────────────────────────────────────────────────────────────────────

// ─── Apple Sign-In nonce utilities ──────────────────────────────────────────
function generateNonce(len = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  arr.forEach((n) => { result += chars[n % chars.length] })
  return result
}

async function sha256Hex(str) {
  const data = new TextEncoder().encode(str)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
// ────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function toEmail(id) {
  return `${id}@ocl-lounge.app`
}

function buildFallbackProfile(user) {
  return {
    id: user.email?.split('@')[0]?.slice(0, 20) || user.uid.slice(0, 8),
    appSettings: { ...DEFAULT_APP_SETTINGS },
    profilePhoto: null,
  }
}

function getPrimaryProvider(user) {
  return user?.providerData?.[0]?.providerId || 'password'
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileStatus, setProfileStatus] = useState('idle')

  const bootstrapProfile = useCallback(async (user) => {
    try {
      setProfileStatus('loading')
      let nextProfile = await getUserProfile(user.uid)
      if (!nextProfile) {
        await ensureUserProfile(user.uid, buildFallbackProfile(user))
        nextProfile = await getUserProfile(user.uid)
      }
      if (nextProfile && !nextProfile.id) {
        const fallback = buildFallbackProfile(user)
        await saveUserProfile(user.uid, { id: fallback.id })
        nextProfile = { ...nextProfile, id: fallback.id }
      }
      if (!nextProfile) throw new Error('프로필을 불러오지 못했습니다.')
      setProfile(nextProfile)
      setProfileStatus('ready')
      // Sync current user's latest profile into the author cache (module-level)
      seedAuthor(user.uid, nextProfile)
      return nextProfile
    } catch {
      setProfile(null)
      setProfileStatus('recovery')
      return null
    }
  }, [])

  const refreshProfile = useCallback(
    async (uid = firebaseUser?.uid) => {
      if (!uid) { setProfile(null); setProfileStatus('guest'); return null }
      const user = firebaseUser?.uid === uid ? firebaseUser : auth?.currentUser
      if (!user) { setProfile(null); setProfileStatus('recovery'); return null }
      return bootstrapProfile(user)
    },
    [bootstrapProfile, firebaseUser],
  )

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      setProfileStatus('guest')
      return
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true)
      setFirebaseUser(user)
      try {
        if (user) {
          await bootstrapProfile(user)
        } else {
          setProfile(null)
          setProfileStatus('guest')
        }
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [bootstrapProfile])

  // Real-time listener on the user's Firestore document.
  // Picks up admin-side changes (isBanned, suspendedUntil) without requiring
  // a logout/login cycle. Runs only after initial profile load is complete.
  useEffect(() => {
    if (!db || !firebaseUser?.uid || profileStatus !== 'ready') return
    const unsub = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        if (!snap.exists()) return
        const data = snap.data()
        setProfile((prev) => {
          if (!prev) return prev
          return { ...prev, ...data, uid: firebaseUser.uid }
        })
        seedAuthor(firebaseUser.uid, { ...snap.data(), uid: firebaseUser.uid })
      },
      () => {},
    )
    return unsub
  }, [firebaseUser?.uid, profileStatus])

  const requireSession = () => {
    if (!firebaseUser) throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
    return firebaseUser
  }

  const loginWithEmail = async (id, pw) => {
    if (!auth) throw new Error('Firebase가 초기화되지 않았습니다. 환경변수를 확인하세요.')
    const cred = await signInWithEmailAndPassword(auth, toEmail(id), pw)
    const p = await bootstrapProfile(cred.user)
    return { user: cred.user, profile: p }
  }

  const signupWithEmail = async (id, pw) => {
    if (!auth) throw new Error('Firebase가 초기화되지 않았습니다. 환경변수를 확인하세요.')
    const cred = await createUserWithEmailAndPassword(auth, toEmail(id), pw)
    await ensureUserProfile(cred.user.uid, { id })
    const p = await bootstrapProfile(cred.user)
    return { user: cred.user, profile: p }
  }

  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase가 초기화되지 않았습니다. 환경변수를 확인하세요.')
    if (isNative()) {
      const { SocialLogin } = await import('@capgo/capacitor-social-login')
      try {
        await SocialLogin.initialize({ google: { webClientId: GOOGLE_WEB_CLIENT_ID } })
        const result = await SocialLogin.login({ provider: 'google', options: {} })
        const idToken = result?.result?.idToken
        if (!idToken) throw new Error('Google 로그인에 실패했어요. 다시 시도해 주세요.')
        const credential = GoogleAuthProvider.credential(idToken)
        const cred = await signInWithCredential(auth, credential)
        await ensureUserProfile(cred.user.uid, buildFallbackProfile(cred.user))
        return bootstrapProfile(cred.user)
      } catch (e) {
        if (isUserCancelledGoogle(e)) throw new Error('로그인을 취소했어요.')
        console.error('[loginWithGoogle] native error:', e)
        throw new Error(e?.message || 'Google 로그인에 실패했어요. 다시 시도해 주세요.')
      }
    }

    // Web: signInWithPopup (unchanged)
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver)
      await ensureUserProfile(cred.user.uid, buildFallbackProfile(cred.user))
      return bootstrapProfile(cred.user)
    } catch (e) {
      if (e.code === 'auth/popup-blocked') throw new Error('팝업이 차단됐어요. 브라우저 팝업 허용 후 다시 시도해 주세요.')
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') throw new Error('로그인 창이 닫혔어요. 다시 시도해 주세요.')
      throw e
    }
  }

  const loginWithApple = async () => {
    if (!auth) throw new Error('Firebase가 초기화되지 않았습니다. 환경변수를 확인하세요.')
    if (isNative() && isIOS()) {
      // iOS: native Apple Sign-In via @capgo/capacitor-social-login
      const { SocialLogin } = await import('@capgo/capacitor-social-login')
      try {
        await SocialLogin.initialize({ apple: {} })
        const rawNonce = generateNonce()
        const hashedNonce = await sha256Hex(rawNonce)
        const result = await SocialLogin.login({
          provider: 'apple',
          options: { nonce: hashedNonce },
        })
        const identityToken = result?.result?.identityToken
        if (!identityToken) throw new Error('Apple 로그인에 실패했어요. 다시 시도해 주세요.')
        const provider = new OAuthProvider('apple.com')
        const credential = provider.credential({ idToken: identityToken, rawNonce })
        const cred = await signInWithCredential(auth, credential)
        await ensureUserProfile(cred.user.uid, buildFallbackProfile(cred.user))
        return bootstrapProfile(cred.user)
      } catch (e) {
        if (isUserCancelledApple(e)) throw new Error('로그인을 취소했어요.')
        console.error('[loginWithApple] native error:', e)
        throw new Error(e?.message || 'Apple 로그인에 실패했어요. 다시 시도해 주세요.')
      }
    }

    // Web / Android: signInWithPopup (Apple does not support Android natively)
    try {
      const cred = await signInWithPopup(auth, new OAuthProvider('apple.com'), browserPopupRedirectResolver)
      await ensureUserProfile(cred.user.uid, buildFallbackProfile(cred.user))
      return bootstrapProfile(cred.user)
    } catch (e) {
      if (e.code === 'auth/popup-blocked') throw new Error('팝업이 차단됐어요. 브라우저 팝업 허용 후 다시 시도해 주세요.')
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') throw new Error('로그인 창이 닫혔어요. 다시 시도해 주세요.')
      throw e
    }
  }

  const logout = async () => {
    setProfileStatus('guest')
    setProfile(null)
    if (auth) await signOut(auth)
  }

  // updateProfile → Firestore 저장 후 재조회 (학교 등 중첩 객체 정확히 반영)
  const updateProfile = async (data) => {
    const user = requireSession()
    if (data.nickname && profile?.nickname && data.nickname !== profile.nickname) {
      logUserChange({ uid: user.uid, previousNickname: profile.nickname, nextNickname: data.nickname }).catch(() => {})
    }
    await saveUserProfile(user.uid, data)
    return refreshProfile(user.uid)
  }

  const updateProfilePhoto = async (file) => {
    const user = requireSession()
    await uploadUserProfilePhoto(user.uid, file, profile?.profilePhoto || null)
    return refreshProfile(user.uid)
  }

  const clearProfilePhoto = async () => {
    const user = requireSession()
    await removeUserProfilePhoto(user.uid, profile?.profilePhoto || null)
    return refreshProfile(user.uid)
  }

  const updateLoginId = async (currentPassword, nextId) => {
    const user = requireSession()
    const normalizedId = nextId.trim()
    if (!normalizedId) throw new Error('아이디를 입력해 주세요.')
    const nextEmail = toEmail(normalizedId)
    const currentEmail = user.email
    if (!currentEmail) throw new Error('이 계정은 아이디 기반 로그인을 사용하지 않습니다.')
    if (currentEmail === nextEmail) return refreshProfile(user.uid)
    if (!currentPassword) throw new Error('현재 비밀번호를 입력해 주세요.')
    const credential = EmailAuthProvider.credential(currentEmail, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updateEmail(user, nextEmail)
    await saveUserProfile(user.uid, { id: normalizedId })
    logUserChange({ uid: user.uid, previousId: profile?.id || '', nextId: normalizedId }).catch(() => {})
    return refreshProfile(user.uid)
  }

  const changePasswordWithCurrent = async (currentPassword, nextPassword) => {
    const user = requireSession()
    const currentEmail = user.email
    if (!currentEmail) throw new Error('이 계정은 비밀번호를 직접 변경할 수 없습니다.')
    if (!currentPassword) throw new Error('현재 비밀번호를 입력해 주세요.')
    if (!nextPassword || nextPassword.length < 6) throw new Error('새 비밀번호는 6자 이상이어야 합니다.')
    const credential = EmailAuthProvider.credential(currentEmail, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, nextPassword)
  }

  const completeOnboarding = async (data) => {
    const user = requireSession()
    await saveUserProfile(user.uid, { ...data, onboardingComplete: true })
    return refreshProfile(user.uid)
  }

  const authProviderType = getPrimaryProvider(firebaseUser)
  const canChangePassword = authProviderType === 'password'

  const value = {
    firebaseUser,
    profile,
    loading,
    profileStatus,
    authProviderType,
    canChangePassword,
    isAuthenticated: Boolean(firebaseUser),
    onboardingComplete: profileStatus === 'ready' ? Boolean(profile?.onboardingComplete) : false,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    loginWithApple,
    logout,
    updateProfile,
    updateProfilePhoto,
    clearProfilePhoto,
    updateLoginId,
    changePasswordWithCurrent,
    completeOnboarding,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
