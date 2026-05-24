import { useCallback, useEffect, useState } from 'react'
import {
  PERMISSION_STATE,
  checkCameraPermission,
  checkLocationPermission,
  checkNotificationPermission,
  checkPhotosPermission,
  isDeniedState,
  isUsable,
  openAppSettings,
  requestCameraPermission,
  requestLocationPermission,
  requestNotificationPermission,
  requestPhotosPermission,
} from '../utils/permissions.js'

const KIND_MAP = {
  notification: { check: checkNotificationPermission, request: requestNotificationPermission },
  photos: { check: checkPhotosPermission, request: requestPhotosPermission },
  camera: { check: checkCameraPermission, request: requestCameraPermission },
  location: { check: checkLocationPermission, request: requestLocationPermission },
}

/**
 * 단일 권한 상태/요청을 다루는 훅
 *
 *   const { state, isReady, request, ensure, openSettings } = usePermission('camera')
 *
 * - ensure(): 이미 허용이면 true, 거부 상태면 false 반환 (요청 X)
 * - request(): 시스템 권한 팝업 띄우기
 */
export function usePermission(kind, { autoCheck = true } = {}) {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(autoCheck)

  const handle = KIND_MAP[kind]
  if (!handle) throw new Error(`[usePermission] unknown kind: ${kind}`)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const next = await handle.check()
      setState(next)
      return next
    } finally {
      setLoading(false)
    }
  }, [handle])

  const request = useCallback(async () => {
    setLoading(true)
    try {
      const next = await handle.request()
      setState(next)
      return next
    } finally {
      setLoading(false)
    }
  }, [handle])

  const ensure = useCallback(async () => {
    const current = await handle.check()
    setState(current)
    return isUsable(current)
  }, [handle])

  useEffect(() => {
    if (autoCheck) void refresh()
  }, [autoCheck, refresh])

  return {
    state,
    isReady: isUsable(state),
    isDenied: isDeniedState(state),
    loading,
    refresh,
    request,
    ensure,
    openSettings: openAppSettings,
  }
}

export { PERMISSION_STATE }
