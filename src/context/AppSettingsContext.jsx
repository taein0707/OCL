import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { useAuth } from './AuthContext.jsx'
import {
  DEFAULT_APP_SETTINGS,
  TAB_DEFINITIONS,
  THEME_PRESETS,
  BUTTON_COLOR_OPTIONS,
  ensureRequiredTabs,
} from '../constants/appSettings.js'

function getContrastColor(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff'
}

const AppSettingsContext = createContext(null)
export const useAppSettings = () => useContext(AppSettingsContext)

export function AppSettingsProvider({ children }) {
  const { profile } = useAuth()
  const [livePatch, setLivePatch] = useState({})

  // Serialize appSettings to a stable string so useMemo only fires when
  // the actual values change, not every time profile gets a new object ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const appSettingsJson = useMemo(
    () => JSON.stringify(profile?.appSettings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile?.appSettings],
  )

  const base = useMemo(
    () => ({ ...DEFAULT_APP_SETTINGS, ...(profile?.appSettings || {}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appSettingsJson],
  )

  const merged = useMemo(
    () => ensureRequiredTabs({ ...base, ...livePatch }),
    [base, livePatch],
  )

  const tabs = useMemo(
    () =>
      merged.tabOrder
        .filter((id) => merged.enabledTabs.includes(id))
        .map((id) => {
          const def = TAB_DEFINITIONS[id]
          return def ? { id, ...def } : null
        })
        .filter(Boolean),
    [merged.tabOrder, merged.enabledTabs],
  )

  const settings = useMemo(() => ({ ...merged, tabs }), [merged, tabs])

  useEffect(() => {
    const themeId = settings.colorTheme || 'BASIC'
    const theme = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0]
    const btnOption = settings.buttonColor
      ? BUTTON_COLOR_OPTIONS.find((o) => o.id === settings.buttonColor)
      : null
    const accentHex = btnOption ? btnOption.hex : theme.primary
    const root = document.documentElement
    root.style.setProperty('--accent', accentHex)
    root.style.setProperty('--accent-foreground', getContrastColor(accentHex))
    root.style.setProperty('--accent-hover', theme.secondary || theme.sub)
    root.style.setProperty('--accent-soft', theme.background)
    root.style.setProperty('--accent-ring', theme.secondary || theme.sub)
    root.style.setProperty('--accent-shadow', accentHex)
    root.style.setProperty('--theme-bg', theme.background)
    root.style.setProperty('--theme-text', theme.text || theme.primary)
  }, [settings.colorTheme, settings.buttonColor])

  useEffect(() => {
    const sizes = { small: '13px', medium: '15px', large: '18px' }
    document.documentElement.style.setProperty('--app-font-size', sizes[settings.fontSize] || '14px')
  }, [settings.fontSize])

  useEffect(() => {
    const weights = { normal: '400', bold: '700', black: '900' }
    document.documentElement.style.setProperty('--app-font-weight', weights[settings.fontWeight] || '400')
  }, [settings.fontWeight])

  const patchSettings = useCallback((partial) => {
    setLivePatch((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetLivePatch = useCallback(() => {
    setLivePatch({})
  }, [])

  const value = useMemo(
    () => ({ settings, patchSettings, resetLivePatch }),
    [settings, patchSettings, resetLivePatch],
  )

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  )
}
