import {
  createContext,
  useContext,
  useMemo,
} from 'react'
import { useAuth } from './AuthContext'

const AppSettingsContext = createContext(null)

export function useAppSettings() {
  return useContext(AppSettingsContext)
}

export function AppSettingsProvider({ children }) {
  const auth = useAuth() || {}
  const profile = auth.firebaseUser ? {} : null

  const settings = useMemo(() => ({
    theme: 'light',
    accent: '#111',
  }), [])

  return (
    <AppSettingsContext.Provider value={{ settings }}>
      {children}
    </AppSettingsContext.Provider>
  )
}