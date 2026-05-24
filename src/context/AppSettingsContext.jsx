import {
  createContext,
  useContext,
  useMemo,
} from 'react'
import { useAuth } from './AuthContext.jsx'

const AppSettingsContext = createContext(null)

export const useAppSettings = () => useContext(AppSettingsContext)

export function AppSettingsProvider({ children }) {
  const { firebaseUser } = useAuth()

  const settings = useMemo(() => ({
    theme: 'light',
    fontSize: 'medium',
    user: firebaseUser,
  }), [firebaseUser])

  return (
    <AppSettingsContext.Provider value={{ settings }}>
      {children}
    </AppSettingsContext.Provider>
  )
}