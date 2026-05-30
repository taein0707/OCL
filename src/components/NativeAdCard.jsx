import { useEffect, useRef, useState, useId } from 'react'
import { Capacitor } from '@capacitor/core'
import { getActiveNativeAdUnitId } from '../services/ads.js'
import { initNativeAd, loadAd, mountAd, updateAdFrame, unmountAd } from '../services/admobNative.js'

// 네이티브 광고 고급형(Native Advanced) 컨테이너.
// iOS Capacitor 빌드에서는 AdMobNativePlugin 이 placeholder 위에 GADNativeAdView 를
// 오버레이하고, 웹/개발 환경에서는 동일 비율의 placeholder UI 를 그립니다.

const AD_HEIGHT = 132 // px — native overlay and placeholder share this height

function getFrameFromEl(el) {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

function AdBadge() {
  return (
    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
      광고 · AD
    </span>
  )
}

function WebPlaceholder({ adData }) {
  return (
    <div className="flex h-full flex-col justify-between px-5 py-4">
      <div className="flex items-center gap-1.5">
        <AdBadge />
        <span className="ml-auto text-[11px] font-semibold text-amber-700">Sponsored</span>
      </div>
      <h3 className="sys-text line-clamp-2 text-[15px] font-black leading-snug text-ink">
        {adData?.headline || '맞춤 추천 후원 콘텐츠'}
      </h3>
      <div className="flex items-center justify-between pt-2 border-t border-amber-300/60">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-white text-[11px] font-black text-amber-700">
            Ad
          </div>
          <p className="truncate text-[12px] font-semibold text-amber-700">
            {adData?.advertiser || 'Google AdMob'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-black text-amber-700">
          {adData?.callToAction || '자세히'}
        </span>
      </div>
    </div>
  )
}

function NativeAdCard() {
  const uid = useId().replace(/:/g, '')
  const adId = useRef(`nativead-${uid}`)
  const containerRef = useRef(null)
  const mountedRef = useRef(false)
  const [adData, setAdData] = useState(null)
  const [isMounted, setIsMounted] = useState(false) // state so scroll effect re-registers
  const [error, setError] = useState(false)

  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform?.()

  useEffect(() => {
    if (!isNative) return
    const id = adId.current
    let alive = true

    ;(async () => {
      try {
        await initNativeAd()

        const adUnitId = getActiveNativeAdUnitId()
        const data = await loadAd(adUnitId, id)
        if (!alive) return
        setAdData(data)

        const el = containerRef.current
        if (!el) return

        const frame = getFrameFromEl(el)
        await mountAd(id, frame)
        if (!alive) return
        mountedRef.current = true
        setIsMounted(true) // triggers scroll-sync effect
      } catch (e) {
        if (alive) setError(true)
      }
    })()

    return () => {
      alive = false
      if (mountedRef.current) {
        unmountAd(id)
        mountedRef.current = false
      }
    }
  }, [isNative])

  // Keep the native overlay in sync with the DOM element on scroll / resize.
  // This effect re-runs once isMounted becomes true (after mountAd resolves).
  useEffect(() => {
    if (!isNative || !isMounted) return

    const id = adId.current
    let rafId = null

    function sync() {
      const el = containerRef.current
      if (el && mountedRef.current) {
        updateAdFrame(id, getFrameFromEl(el))
      }
    }

    function onScroll() {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(sync)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isNative, isMounted])

  if (error) return null

  return (
    <article
      ref={containerRef}
      style={{ height: AD_HEIGHT }}
      className="neo-card overflow-hidden border-amber-300/60 bg-amber-50/40"
      aria-label="후원 광고"
    >
      {/* On native: transparent — GADNativeAdView overlays this exact rect.
          On web: show placeholder UI with whatever metadata we got. */}
      {!isNative || !adData ? (
        <WebPlaceholder adData={adData} />
      ) : (
        // Native: keep div transparent so the overlay is visible through the WebView.
        <div className="h-full w-full bg-transparent" />
      )}
    </article>
  )
}

export default NativeAdCard
