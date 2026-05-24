import { useCallback, useState } from 'react'
import {
  PERMISSION_STATE,
  checkCameraPermission,
  checkLocationPermission,
  isUsable,
  requestCameraPermission,
  requestLocationPermission,
} from '../utils/permissions.js'

const KIND_MAP = {
  camera: { check: checkCameraPermission, request: requestCameraPermission },
  location: { check: checkLocationPermission, request: requestLocationPermission },
}

/**
 * 사용 시점에만 권한을 요청하는 게이트 훅.
 *
 *   const camera = useRequirePermission('camera')
 *   const onShoot = async () => {
 *     const ok = await camera.run(() => openCameraSheet())
 *     if (!ok) camera.openDenialDialog()
 *   }
 *
 * 흐름:
 *   1. 현재 상태 확인 → 허용이면 바로 액션 실행
 *   2. prompt 상태면 시스템 권한 팝업 → 허용 시 액션 실행
 *   3. denied 상태면 액션 미실행 + denied 다이얼로그 노출 플래그 설정
 */
export function useRequirePermission(kind) {
  const handle = KIND_MAP[kind]
  if (!handle) throw new Error(`[useRequirePermission] unknown kind: ${kind}`)

  const [showDenial, setShowDenial] = useState(false)
  const [lastState, setLastState] = useState(null)

  const run = useCallback(
    async (action) => {
      const current = await handle.check()
      if (isUsable(current)) {
        setLastState(current)
        if (typeof action === 'function') await action()
        return true
      }

      if (current === PERMISSION_STATE.DENIED) {
        setLastState(current)
        setShowDenial(true)
        return false
      }

      const next = await handle.request()
      setLastState(next)
      if (isUsable(next)) {
        if (typeof action === 'function') await action()
        return true
      }
      if (next === PERMISSION_STATE.DENIED) setShowDenial(true)
      return false
    },
    [handle],
  )

  const closeDenial = useCallback(() => setShowDenial(false), [])
  const openDenialDialog = useCallback(() => setShowDenial(true), [])

  return {
    state: lastState,
    showDenial,
    closeDenial,
    openDenialDialog,
    run,
  }
}
