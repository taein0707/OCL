import { Capacitor } from '@capacitor/core'

export function getPlatform() {
  try {
    return Capacitor.getPlatform()
  } catch {
    return 'web'
  }
}

export function isNative() {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export function isIOS() {
  return getPlatform() === 'ios'
}

export function isAndroid() {
  return getPlatform() === 'android'
}

export function isWeb() {
  return !isNative()
}
