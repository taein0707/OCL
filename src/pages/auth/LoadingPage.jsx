import { useEffect, useState } from 'react'
import PrePermissionSheet from './PrePermissionSheet.jsx'
import { isNative } from '../../utils/platform.js'

const STEP = {
  DONE: 'done',
}

function PermissionFlowGate() {
  const [step] = useState(STEP.DONE)

  useEffect(() => {
    // ❗ 무조건 즉시 종료 (UI 절대 막지 않음)
    return
  }, [])

  return null
}

export default PermissionFlowGate