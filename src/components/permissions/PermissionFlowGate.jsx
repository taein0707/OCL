import { useEffect, useState } from 'react'
import PrePermissionSheet from './PrePermissionSheet.jsx'
import { isNative } from '../../utils/platform.js'
import {
  PERMISSION_STATE,
  checkNotificationPermission,
  checkPhotosPermission,
  requestNotificationPermission,
  requestPhotosPermission,
  hasCompletedFirstRunPermissionFlow,
  markFirstRunPermissionFlowCompleted,
} from '../../utils/permissions.js'

const STEP = {
  IDLE: 'idle',
  NOTIFICATION: 'notification',
  PHOTOS: 'photos',
  DONE: 'done',
}

function PermissionFlowGate() {
  const [step, setStep] = useState(STEP.IDLE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isNative()) return

    async function initFlow() {
      const alreadyDone = await hasCompletedFirstRunPermissionFlow()
      if (alreadyDone) return

      const [notifState, photosState] = await Promise.all([
        checkNotificationPermission(),
        checkPhotosPermission(),
      ])

      if (notifState === PERMISSION_STATE.PROMPT) {
        setStep(STEP.NOTIFICATION)
      } else if (photosState === PERMISSION_STATE.PROMPT) {
        setStep(STEP.PHOTOS)
      } else {
        await markFirstRunPermissionFlowCompleted()
      }
    }

    initFlow()
  }, [])

  async function advanceAfterNotif() {
    const photosState = await checkPhotosPermission()
    if (photosState === PERMISSION_STATE.PROMPT) {
      setStep(STEP.PHOTOS)
    } else {
      await markFirstRunPermissionFlowCompleted()
      setStep(STEP.DONE)
    }
  }

  const handleNotifAllow = async () => {
    setLoading(true)
    try {
      await requestNotificationPermission()
    } finally {
      setLoading(false)
    }
    await advanceAfterNotif()
  }

  const handleNotifDismiss = async () => {
    await advanceAfterNotif()
  }

  const handlePhotosAllow = async () => {
    setLoading(true)
    try {
      await requestPhotosPermission()
    } finally {
      setLoading(false)
    }
    await markFirstRunPermissionFlowCompleted()
    setStep(STEP.DONE)
  }

  const handlePhotosDismiss = async () => {
    await markFirstRunPermissionFlowCompleted()
    setStep(STEP.DONE)
  }

  if (step === STEP.NOTIFICATION) {
    return (
      <PrePermissionSheet
        open
        icon="🔔"
        title="알림을 허용해 주세요"
        description="댓글, 공감, 친구 요청 알림을 놓치지 않을 수 있어요."
        bullets={[
          '내 스냅에 댓글이 달리면 바로 알려드려요',
          '친구 요청과 공감 알림을 받을 수 있어요',
          '학교 공지와 새 소식을 놓치지 않아요',
        ]}
        loading={loading}
        onAllow={handleNotifAllow}
        onDismiss={handleNotifDismiss}
      />
    )
  }

  if (step === STEP.PHOTOS) {
    return (
      <PrePermissionSheet
        open
        icon="🖼️"
        title="사진 접근을 허용해 주세요"
        description="스냅에 사진과 동영상을 첨부할 수 있어요."
        bullets={[
          '게시글에 사진·동영상을 첨부해요',
          '프로필 사진을 내 라이브러리에서 골라요',
        ]}
        loading={loading}
        onAllow={handlePhotosAllow}
        onDismiss={handlePhotosDismiss}
      />
    )
  }

  return null
}

export default PermissionFlowGate
