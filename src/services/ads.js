import {
  ADMOB_APP_ID,
  ADMOB_NATIVE_AD_UNIT_ID,
  ADMOB_TEST_NATIVE_AD_UNIT_ID,
  AD_FEED_INTERVAL,
  AD_FEED_FIRST_OFFSET,
} from '../constants/ads.js'

const isDev = typeof import.meta !== 'undefined' && import.meta?.env?.DEV

export function getActiveNativeAdUnitId() {
  return isDev ? ADMOB_TEST_NATIVE_AD_UNIT_ID : ADMOB_NATIVE_AD_UNIT_ID
}

export function getAdMobAppId() {
  return ADMOB_APP_ID
}

let admobReady = false
let admobInitPromise = null

// 네이티브 환경(Capacitor)에서만 AdMob 플러그인을 동적으로 로드합니다.
// 웹 환경에서는 컴포넌트 측에서 placeholder UI를 렌더링합니다.
export async function initAdMob() {
  if (admobReady) return true
  if (admobInitPromise) return admobInitPromise

  admobInitPromise = (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core').catch(() => ({ Capacitor: null }))
      if (!Capacitor || !Capacitor.isNativePlatform?.()) return false

      // 선택적 의존성: 번들 단계에선 해석하지 않고, 런타임에 플러그인이 있을 때만 로드합니다.
      const pkgName = '@capacitor-community/admob'
      const mod = await import(/* @vite-ignore */ pkgName).catch(() => null)
      if (!mod?.AdMob) return false

      await mod.AdMob.initialize({
        requestTrackingAuthorization: true,
        initializeForTesting: isDev,
      })
      admobReady = true
      return true
    } catch (err) {
      console.warn('[ads] AdMob initialize failed:', err?.message || err)
      return false
    }
  })()

  return admobInitPromise
}

// 피드 배열에 광고 마커를 자연스러운 간격으로 끼워 넣어 반환합니다.
// items.length 가 적으면 광고를 1개만, 길어질수록 N개씩 추가됩니다.
export function injectAdsIntoFeed(posts, options = {}) {
  const interval = Math.max(3, options.interval || AD_FEED_INTERVAL)
  const firstOffset = Math.max(2, options.firstOffset || AD_FEED_FIRST_OFFSET)
  const result = []
  let adCount = 0

  posts.forEach((post, index) => {
    result.push({ type: 'post', post })
    const slot = index + 1
    const shouldInsert = slot === firstOffset || (slot > firstOffset && (slot - firstOffset) % interval === 0)
    if (shouldInsert && slot < posts.length) {
      adCount += 1
      result.push({ type: 'ad', id: `ad-${slot}-${adCount}` })
    }
  })

  return result
}
