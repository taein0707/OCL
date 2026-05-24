import { createContext, useContext, useState } from 'react'

const AppSettingsContext = createContext(null)

export const useAppSettings = () => useContext(AppSettingsContext)

export function AppSettingsProvider({ children }) {
  const [settings] = useState({})

  return (
    <AppSettingsContext.Provider value={{ settings }}>
      {children}
    </AppSettingsContext.Provider>
  )
}