import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '../firebase/index.js'
import {
  getUserProfile,
  saveUserProfile,
  uploadUserProfilePhoto,
  removeUserProfilePhoto,
  isOnboardingDone,
} from '../services/userProfile.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileStatus, setProfileStatus] = useState('loading')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Firebase가 초기화되지 않은 경우(env var 누락) 방어
    if (!auth) {
      console.error('[AuthContext] auth is null — check VITE_FIREBASE_* env vars')
      setLoading(false)
      setProfileStatus('none')
      return
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)

      if (!user) {
        setProfile(null)
        setProfileStatus('none')
        setLoading(false)
        return
      }

      try {
        const prof = await getUserProfile(user.uid)
        setProfile(prof)
        setProfileStatus('ready')
      } catch (err) {
        console.error('[AuthContext] profile fetch failed:', err)
        setProfile(null)
        setProfileStatus('recovery')
      } finally {
        setLoading(false)
      }
    })

    return unsub
  }, [])

  const loginWithEmail = useCallback(
    (id, pw) => signInWithEmailAndPassword(auth, `${id}@ocl-lounge.app`, pw),
    [],
  )

  const signupWithEmail = useCallback(
    (id, pw) => createUserWithEmailAndPassword(auth, `${id}@ocl-lounge.app`, pw),
    [],
  )

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }, [])

  const loginWithApple = useCallback(async () => {
    const provider = new OAuthProvider('apple.com')
    return signInWithPopup(auth, provider)
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setFirebaseUser(null)
    setProfile(null)
    setProfileStatus('none')
  }, [])

  const updateProfile = useCallback(
    async (data) => {
      if (!firebaseUser) return
      await saveUserProfile(firebaseUser.uid, data)
      setProfile((prev) => ({ ...prev, ...data }))
    },
    [firebaseUser],
  )

  const completeOnboarding = useCallback(
    async (data) => {
      if (!firebaseUser) return
      const payload = { ...data, onboardingComplete: true }
      await saveUserProfile(firebaseUser.uid, payload)
      setProfile((prev) => ({ ...prev, ...payload }))
    },
    [firebaseUser],
  )

  const updateProfilePhoto = useCallback(
    async (file) => {
      if (!firebaseUser) return
      const photoData = await uploadUserProfilePhoto(
        firebaseUser.uid,
        file,
        profile?.profilePhoto ?? null,
      )
      setProfile((prev) => ({ ...prev, profilePhoto: photoData }))
    },
    [firebaseUser, profile],
  )

  const clearProfilePhoto = useCallback(
    async () => {
      if (!firebaseUser) return
      await removeUserProfilePhoto(firebaseUser.uid, profile?.profilePhoto ?? null)
      setProfile((prev) => ({ ...prev, profilePhoto: null }))
    },
    [firebaseUser, profile],
  )

  const isAuthenticated = !!firebaseUser
  const onboardingComplete = isOnboardingDone(profile)

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        isAuthenticated,
        loading,
        profileStatus,
        onboardingComplete,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithApple,
        logout,
        updateProfile,
        completeOnboarding,
        updateProfilePhoto,
        clearProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
