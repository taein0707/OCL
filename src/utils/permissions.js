/**
 * OCL 권한 시스템 (Capacitor)
 *
 * - 앱 최초 실행: 알림 / 사진(라이브러리) 권한만 자체 안내 → 시스템 팝업 요청
 * - 카메라 / 위치: 사용 시점에만 요청 (버튼 탭 시점)
 * - 거부 상태: 자체 안내 후 시스템 설정 이동
 *
 * 상태 값은 모두 동일한 enum 으로 매핑한다:
 *   'granted' | 'denied' | 'limited' | 'prompt' | 'unsupported'
 */

import { App } from '@capacitor/app'
import { Camera } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { PushNotifications } from '@capacitor/push-notifications'
import { Preferences } from '@capacitor/preferences'
import { isNative, isIOS, isAndroid } from './platform.js'

const FIRST_RUN_KEY = 'ocl.permission.first_run_completed'
const NOTIF_ASKED_KEY = 'ocl.permission.notification_asked'
const PHOTO_ASKED_KEY = 'ocl.permission.photo_asked'

export const PERMISSION_STATE = {
  GRANTED: 'granted',
  DENIED: 'denied',
  LIMITED: 'limited', // iOS 사진 일부 허용
  PROMPT: 'prompt',
  UNSUPPORTED: 'unsupported',
}

function normalize(value) {
  if (!value) return PERMISSION_STATE.PROMPT
  // Capacitor 의 'granted' / 'denied' / 'prompt' / 'prompt-with-rationale' / 'limited'
  if (value === 'prompt-with-rationale') return PERMISSION_STATE.PROMPT
  if (Object.values(PERMISSION_STATE).includes(value)) return value
  return PERMISSION_STATE.PROMPT
}

// ───────────────────────────── 알림 ─────────────────────────────
export async function checkNotificationPermission() {
  if (!isNative()) {
    if (typeof Notification === 'undefined') return PERMISSION_STATE.UNSUPPORTED
    if (Notification.permission === 'granted') return PERMISSION_STATE.GRANTED
    if (Notification.permission === 'denied') return PERMISSION_STATE.DENIED
    return PERMISSION_STATE.PROMPT
  }
  try {
    const result = await PushNotifications.checkPermissions()
    return normalize(result.receive)
  } catch (error) {
    console.warn('[permissions] checkNotification failed:', error)
    return PERMISSION_STATE.UNSUPPORTED
  }
}

export async function requestNotificationPermission() {
  await setAsked(NOTIF_ASKED_KEY)
  if (!isNative()) {
    if (typeof Notification === 'undefined') return PERMISSION_STATE.UNSUPPORTED
    const result = await Notification.requestPermission()
    if (result === 'granted') return PERMISSION_STATE.GRANTED
    if (result === 'denied') return PERMISSION_STATE.DENIED
    return PERMISSION_STATE.PROMPT
  }
  try {
    const result = await PushNotifications.requestPermissions()
    const state = normalize(result.receive)
    if (state === PERMISSION_STATE.GRANTED) {
      // FCM 등록은 실패해도 무시한다 (서버 토큰 등록은 별도 처리)
      try {
        await PushNotifications.register()
      } catch (error) {
        console.warn('[permissions] PushNotifications.register failed:', error)
      }
    }
    return state
  } catch (error) {
    console.warn('[permissions] requestNotification failed:', error)
    return PERMISSION_STATE.UNSUPPORTED
  }
}

// ─────────────────────────── 사진 / 카메라 ───────────────────────────
// iOS 의 photos / camera 는 Capacitor Camera 플러그인이 단일 객체로 다룬다.
export async function checkPhotosPermission() {
  if (!isNative()) return PERMISSION_STATE.GRANTED // 웹은 input[type=file] 사용
  try {
    const result = await Camera.checkPermissions()
    return normalize(result.photos)
  } catch (error) {
    console.warn('[permissions] checkPhotos failed:', error)
    return PERMISSION_STATE.UNSUPPORTED
  }
}

export async function requestPhotosPermission() {
  await setAsked(PHOTO_ASKED_KEY)
  if (!isNative()) return PERMISSION_STATE.GRANTED
  try {
    const result = await Camera.requestPermissions({ permissions: ['photos'] })
    return normalize(result.photos)
  } catch (error) {
    console.warn('[permissions] requestPhotos failed:', error)
    return PERMISSION_STATE.UNSUPPORTED
  }
}

export async function checkCameraPermission() {
  if (!isNative()) {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return PERMISSION_STATE.UNSUPPORTED
    return PERMISSION_STATE.PROMPT
  }
  try {
    const result = await Camera.checkPermissions()
    return normalize(result.camera)
  } catch (error) {
    console.warn('[permissions] checkCamera failed:', error)
    return PERMISSION_STATE.UNSUPPORTED
  }
}

export async function requestCameraPermission() {
  if (!isNative()) return PERMISSION_STATE.GRANTED
  try {
    const result = await Camera.requestPermissions({ permissions: ['camera'] })
    return normalize(result.camera)
  } catch (error) {
    console.warn('[permissions] requestCamera failed:', error)
    return PERMISSION_STATE.UNSUPPORTED
  }
}

// ───────────────────────────── 위치 ─────────────────────────────
export async function checkLocationPermission() {
  if (!isNative()) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return PERMISSION_STATE.UNSUPPORTED
    return PERMISSION_STATE.PROMPT
  }
  try {
    const result = await Geolocation.checkPermissions()
    return normalize(result.location)
  } catch (error) {
    console.warn('[permissions] checkLocation failed:', error)
    return PERMISSION_STATE.UNSUPPORTED
  }
}

export async function requestLocationPermission() {
  if (!isNative()) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return PERMISSION_STATE.UNSUPPORTED
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(PERMISSION_STATE.GRANTED),
        (error) => {
          if (error?.code === 1) resolve(PERMISSION_STATE.DENIED)
          else resolve(PERMISSION_STATE.PROMPT)
        },
        { timeout: 5000 },
      )
    })
  }
  try {
    const result = await Geolocation.requestPermissions({ permissions: ['location'] })
    return normalize(result.location)
  } catch (error) {
    console.warn('[permissions] requestLocation failed:', error)
    return PERMISSION_STATE.UNSUPPORTED
  }
}

// ─────────────────────── 설정 앱 이동 ───────────────────────
export async function openAppSettings() {
  if (!isNative()) {
    // 웹은 브라우저 사이트 설정으로 직접 보낼 수 없음. 안내만 한다.
    return false
  }
  try {
    // @capacitor/app 8.x 는 openSettings 를 지원한다.
    if (typeof App.openSettings === 'function') {
      await App.openSettings()
      return true
    }
    // 일부 버전에서는 미지원 → 폴백
    if (isIOS() && typeof window !== 'undefined') {
      window.location.href = 'app-settings:'
      return true
    }
  } catch (error) {
    console.warn('[permissions] openAppSettings failed:', error)
  }
  return false
}

// ─────────────────────── 최초 실행 / 요청 기록 ───────────────────────
async function prefGet(key) {
  if (isNative()) {
    try {
      const { value } = await Preferences.get({ key })
      return value
    } catch (error) {
      console.warn('[permissions] Preferences.get failed:', error)
    }
  }
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  } catch {
    return null
  }
}

async function prefSet(key, value) {
  if (isNative()) {
    try {
      await Preferences.set({ key, value })
      return
    } catch (error) {
      console.warn('[permissions] Preferences.set failed:', error)
    }
  }
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
  } catch {
    /* noop */
  }
}

export async function hasCompletedFirstRunPermissionFlow() {
  return (await prefGet(FIRST_RUN_KEY)) === '1'
}

export async function markFirstRunPermissionFlowCompleted() {
  await prefSet(FIRST_RUN_KEY, '1')
}

async function setAsked(key) {
  await prefSet(key, '1')
}

export async function wasAsked(kind) {
  const map = { notification: NOTIF_ASKED_KEY, photo: PHOTO_ASKED_KEY }
  const key = map[kind]
  if (!key) return false
  return (await prefGet(key)) === '1'
}

export function isDeniedState(state) {
  return state === PERMISSION_STATE.DENIED
}

export function isUsable(state) {
  return state === PERMISSION_STATE.GRANTED || state === PERMISSION_STATE.LIMITED
}

export const PLATFORM_HINTS = {
  ios: '아이폰 [설정] → [OCL] 에서 권한을 변경할 수 있어요.',
  android: '[설정] → [앱] → [OCL] → [권한] 에서 변경할 수 있어요.',
  web: '브라우저 주소창 좌측 자물쇠 아이콘에서 권한을 변경할 수 있어요.',
}

export function getPlatformHint() {
  if (isIOS()) return PLATFORM_HINTS.ios
  if (isAndroid()) return PLATFORM_HINTS.android
  return PLATFORM_HINTS.web
}
