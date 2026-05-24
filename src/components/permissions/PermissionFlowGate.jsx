import { useEffect, useState } from 'react'
import { isNative } from '../../utils/platform.js'

function PermissionFlowGate() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        if (!isNative()) {
          setReady(true)
          return
        }

        // 여기서 실패해도 무조건 통과
        setReady(true)
      } catch (e) {
        setReady(true)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [])

  // 🔥 핵심: 절대 화면 막지 않음
  if (!ready) return null

  return null
}

export default PermissionFlowGate