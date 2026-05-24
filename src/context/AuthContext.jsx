import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const loginWithEmail = (id, pw) => {
    return signInWithEmailAndPassword(auth, `${id}@ocl-lounge.app`, pw)
  }

  const logout = () => {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        isAuthenticated: !!firebaseUser,
        loading,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}