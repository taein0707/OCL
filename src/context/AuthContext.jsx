import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from 'firebase/auth'
import { auth } from '../firebase/index.js'
import {
  getUserProfile,
  ensureUserProfile,
  saveUserProfile,
  uploadUserProfilePhoto,
  removeUserProfilePhoto,
} from '../services/userProfile.js'
import { DEFAULT_APP_SETTINGS } from '../constants/appSettings.js'

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
  const [recoveryMessage, setRecoveryMessage] = useState('')

  const bootstrapProfile = useCallback(async (user) => {
    try {
      setProfileStatus('loading')
      let nextProfile = await getUserProfile(user.uid)
      if (!nextProfile) {
        await ensureUserProfile(user.uid, buildFallbackProfile(user))
        nextProfile = await getUserProfile(user.uid)
      }
      if (nextProfile && !nextProfile.id) {
        const fallbackProfile = buildFallbackProfile(user)
        await saveUserProfile(user.uid, { id: fallbackProfile.id })
        nextProfile = { ...nextProfile, id: fallbackProfile.id }
      }
      if (!nextProfile) throw new Error('프로필을 불러오지 못했습니다.')
      setProfile(nextProfile)
      setProfileStatus('ready')
      setRecoveryMessage('')
      return nextProfile
    } catch (error) {
      setProfile(null)
      setProfileStatus('recovery')
      setRecoveryMessage('세션을 다시 확인했어요. 로그인 후 이어서 진행해 주세요.')
      return null
    }
  }, [])

  const refreshProfile = useCallback(
    async (uid = firebaseUser?.uid) => {
      if (!uid) {
        setProfile(null)
        setProfileStatus('guest')
        return null
      }
      const user = firebaseUser?.uid === uid ? firebaseUser : auth.currentUser
      if (!user) {
        setProfile(null)
        setProfileStatus('recovery')
        return null
      }
      return bootstrapProfile(user)
    },
    [bootstrapProfile, firebaseUser],
  )

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true)
      setFirebaseUser(user)

      try {
        if (user) {
          await bootstrapProfile(user)
        } else {
          setProfile(null)
          setProfileStatus('guest')
          setRecoveryMessage('')
        }
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [bootstrapProfile])

  const loginWithEmail = async (id, pw) => {
    const email = toEmail(id)
    const cred = await signInWithEmailAndPassword(auth, email, pw)
    const p = await bootstrapProfile(cred.user)
    return { user: cred.user, profile: p }
  }

  const signupWithEmail = async (id, pw) => {
    const email = toEmail(id)
    const cred = await createUserWithEmailAndPassword(auth, email, pw)
    await ensureUserProfile(cred.user.uid, { id })
    const p = await bootstrapProfile(cred.user)
    return { user: cred.user, profile: p }
  }

  const checkIdExists = async (id) => {
    const email = toEmail(id)
    const methods = await fetchSignInMethodsForEmail(auth, email).catch(() => [])
    return methods.length > 0
  }

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider())
      await ensureUserProfile(cred.user.uid, buildFallbackProfile(cred.user))
      return bootstrapProfile(cred.user)
    } catch (e) {
      if (e.code === 'auth/popup-blocked') throw new Error('팝업이 차단됐어요. 브라우저 팝업 허용 후 다시 시도해 주세요.')
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') throw new Error('로그인 창이 닫혔어요. 다시 시도해 주세요.')
      if (e.code === 'auth/unauthorized-domain') throw new Error('이 도메인은 소셜 로그인이 허용되지 않아요. Firebase 콘솔 → Authentication → Settings → Authorized domains에 현재 도메인을 추가해 주세요.')
      if (e.code === 'auth/operation-not-allowed') throw new Error('Google 로그인이 비활성화 상태예요. Firebase 콘솔 → Authentication → Sign-in method에서 Google을 활성화해 주세요.')
      throw e
    }
  }

  const loginWithApple = async () => {
    try {
      const cred = await signInWithPopup(auth, new OAuthProvider('apple.com'))
      await ensureUserProfile(cred.user.uid, buildFallbackProfile(cred.user))
      return bootstrapProfile(cred.user)
    } catch (e) {
      if (e.code === 'auth/popup-blocked') throw new Error('팝업이 차단됐어요. 브라우저 팝업 허용 후 다시 시도해 주세요.')
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') throw new Error('로그인 창이 닫혔어요. 다시 시도해 주세요.')
      if (e.code === 'auth/unauthorized-domain') throw new Error('이 도메인은 소셜 로그인이 허용되지 않아요. Firebase 콘솔 → Authorized domains 확인이 필요해요.')
      if (e.code === 'auth/operation-not-allowed') throw new Error('Apple 로그인이 비활성화 상태예요. Firebase 콘솔 → Authentication → Sign-in method에서 Apple을 설정해 주세요.')
      throw e
    }
  }

  const logout = async () => {
    setProfileStatus('guest')
    setProfile(null)
    await signOut(auth)
  }

  const requireSession = () => {
    if (!firebaseUser) throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
    return firebaseUser
  }

  const updateProfile = async (data) => {
    const user = requireSession()
    await saveUserProfile(user.uid, data)
    return refreshProfile(user.uid)
  }

  const updateProfilePhoto = async (file) => {
    const user = requireSession()
    const currentPhoto = profile?.profilePhoto || null
    await uploadUserProfilePhoto(user.uid, file, currentPhoto)
    return refreshProfile(user.uid)
  }

  const clearProfilePhoto = async () => {
    const user = requireSession()
    const currentPhoto = profile?.profilePhoto || null
    await removeUserProfilePhoto(user.uid, currentPhoto)
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

    const methods = await fetchSignInMethodsForEmail(auth, nextEmail).catch(() => [])
    if (methods.length > 0) throw new Error('이미 사용 중인 아이디입니다.')
    if (!currentPassword) throw new Error('현재 비밀번호를 입력해 주세요.')

    const credential = EmailAuthProvider.credential(currentEmail, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updateEmail(user, nextEmail)
    await saveUserProfile(user.uid, { id: normalizedId })
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
    await saveUserProfile(user.uid, {
      ...data,
      onboardingComplete: true,
    })
    return refreshProfile(user.uid)
  }

  const authProviderType = getPrimaryProvider(firebaseUser)
  const canChangePassword = authProviderType === 'password'

  const value = {
    firebaseUser,
    profile,
    loading,
    profileStatus,
    recoveryMessage,
    authProviderType,
    canChangePassword,
    isAuthenticated: Boolean(firebaseUser),
    hasResolvedProfile: profileStatus === 'ready',
    needsRecovery: profileStatus === 'recovery',
    onboardingComplete: profileStatus === 'ready' ? Boolean(profile?.onboardingComplete) : false,
    checkIdExists,
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
