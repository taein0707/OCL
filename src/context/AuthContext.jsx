import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase/index.js'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔥 핵심: 로그인 상태만 단순하게 유지
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setLoading(false)
    })

    return unsub
  }, [])

  const logout = async () => {
    await signOut(auth)
  }

  const value = {
    firebaseUser,
    loading,
    isAuthenticated: !!firebaseUser,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}