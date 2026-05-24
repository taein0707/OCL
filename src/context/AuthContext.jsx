import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/index.js'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = (id, pw) =>
    signInWithEmailAndPassword(auth, `${id}@ocl-lounge.app`, pw)

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}