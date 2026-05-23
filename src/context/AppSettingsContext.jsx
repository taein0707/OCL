import { createContext, useContext, useLayoutEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import {
  DEFAULT_APP_SETTINGS,
  FONT_SIZE_CLASS,
  ANIMATION_CLASS,
  BUTTON_COLOR_OPTIONS,
  LEGACY_BUTTON_COLOR_MAP,
  ensureRequiredTabs,
  TAB_DEFINITIONS,
} from '../constants/appSettings.js'

const AppSettingsContext = createContext(null)
const DEFAULT_ACCENT = BUTTON_COLOR_OPTIONS[BUTTON_COLOR_OPTIONS.length - 1]

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3 ? value.split('').map((c) => `${c}${c}`).join('') : value
  const num = Number.parseInt(normalized, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')}`
}

function mixHex(hex, amount, target) {
  const source = hexToRgb(hex)
  const destination = target === 'white' ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
  return rgbToHex({
    r: source.r + (destination.r - source.r) * amount,
    g: source.g + (destination.g - source.g) * amount,
    b: source.b + (destination.b - source.b) * amount,
  })
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const values = [r, g, b].map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2]
}

function getContrastColor(hex) {
  return getRelativeLuminance(hex) > 0.45 ? '#111111' : '#ffffff'
}

function normalizeButtonColor(buttonColor) {
  if (BUTTON_COLOR_OPTIONS.some((option) => option.id === buttonColor)) return buttonColor
  return LEGACY_BUTTON_COLOR_MAP[buttonColor] || DEFAULT_APP_SETTINGS.buttonColor
}

function resolveAccent(buttonColor) {
  const normalized = normalizeButtonColor(buttonColor)
  return BUTTON_COLOR_OPTIONS.find((option) => option.id === normalized) || DEFAULT_ACCENT
}

function clampTabOrder(settings) {
  const order = [...settings.tabOrder]
  Object.entries(TAB_DEFINITIONS).forEach(([tabId, tab]) => {
    if (typeof tab.fixedIndex !== 'number') return
    const currentIndex = order.indexOf(tabId)
    if (currentIndex >= 0) order.splice(currentIndex, 1)
    order.splice(Math.min(tab.fixedIndex, order.length), 0, tabId)
  })
  return { ...settings, tabOrder: order }
}

function applyRootSettings(settings, accent) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  root.classList.remove(
    'font-size-small',
    'font-size-medium',
    'font-size-large',
    'dark',
    'motion-strong',
    'motion-reduce',
  )

  const fs = FONT_SIZE_CLASS[settings.fontSize] || FONT_SIZE_CLASS.small
  if (fs) root.classList.add(fs)
  if (settings.theme === 'dark') root.classList.add('dark')
  const anim = ANIMATION_CLASS[settings.animationLevel] ?? ''
  if (anim) root.classList.add(anim)

  root.style.setProperty('--accent', accent.hex)
  root.style.setProperty('--accent-foreground', accent.foreground)
  root.style.setProperty('--accent-hover', accent.hover)
  root.style.setProperty('--accent-soft', accent.soft)
  root.style.setProperty('--accent-ring', accent.ring)
  root.style.setProperty('--accent-shadow', accent.shadow)
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider')
  return ctx
}

export function AppSettingsProvider({ children }) {
  const { profile } = useAuth()
  const [livePatch, setLivePatch] = useState({})

  const settings = useMemo(() => {
    const merged = ensureRequiredTabs({
      ...DEFAULT_APP_SETTINGS,
      ...(profile?.appSettings || {}),
      ...livePatch,
    })
    return {
      ...merged,
      buttonColor: normalizeButtonColor(merged.buttonColor),
    }
  }, [profile?.appSettings, livePatch])

  const accent = useMemo(() => {
    const option = resolveAccent(settings.buttonColor)
    const foreground = getContrastColor(option.hex)
    const hover = mixHex(option.hex, foreground === '#ffffff' ? 0.12 : 0.08, foreground === '#ffffff' ? 'black' : 'white')
    const soft = mixHex(option.hex, 0.84, 'white')
    const ring = mixHex(option.hex, 0.72, 'white')
    const shadow = mixHex(option.hex, foreground === '#ffffff' ? 0.42 : 0.22, 'black')
    return {
      ...option,
      foreground,
      hover,
      soft,
      ring,
      shadow,
    }
  }, [settings.buttonColor])

  const patchSettings = useCallback((partial) => {
    setLivePatch((prev) => clampTabOrder(ensureRequiredTabs({ ...prev, ...partial })))
  }, [])

  const resetLivePatch = useCallback(() => setLivePatch({}), [])

  useLayoutEffect(() => {
    applyRootSettings(settings, accent)
  }, [settings, accent])

  const value = {
    settings,
    accent,
    patchSettings,
    resetLivePatch,
    normalizeButtonColor,
  }

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}
