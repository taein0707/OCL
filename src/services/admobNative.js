import { registerPlugin } from '@capacitor/core'

// Lazy-register the plugin so it doesn't throw on web where the bridge is absent.
let _plugin = null
function getPlugin() {
  if (!_plugin) {
    try {
      _plugin = registerPlugin('AdMobNative')
    } catch {
      _plugin = null
    }
  }
  return _plugin
}

export async function initNativeAd() {
  const p = getPlugin()
  if (!p) return false
  try {
    const res = await p.initialize()
    return Boolean(res?.initialized)
  } catch {
    return false
  }
}

export async function loadAd(adUnitId, id) {
  const p = getPlugin()
  if (!p) throw new Error('AdMobNative plugin unavailable')
  return p.loadAd({ adUnitId, id })
}

export async function mountAd(id, frame) {
  const p = getPlugin()
  if (!p) throw new Error('AdMobNative plugin unavailable')
  return p.mountAd({ id, frame })
}

export async function updateAdFrame(id, frame) {
  const p = getPlugin()
  if (!p) return
  return p.updateAdFrame({ id, frame })
}

export async function unmountAd(id) {
  const p = getPlugin()
  if (!p) return
  try {
    await p.unmountAd({ id })
  } catch {
    // best-effort cleanup
  }
}
