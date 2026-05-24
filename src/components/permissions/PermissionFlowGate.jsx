import { useEffect, useState } from 'react'
import {
  PERMISSION_STATE,
  checkNotificationPermission,
  checkPhotosPermission,
  hasCompletedFirstRunPermissionFlow,
  markFirstRunPermissionFlowCompleted,
  requestNotificationPermission,
  requestPhotosPermission,
} from '../../utils/permissions.js'
import { isNative } from '../../utils/platform.js'
import PrePermissionSheet from './PrePermissionSheet.jsx'

const STEP = {
  IDLE: 'idle',
  NOTIFICATION: 'notification',
  PHOTOS: 'photos',
  DONE: 'done',
}

function PermissionFlowGate() {
  const [step, setStep] = useState(STEP.IDLE)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        if (!isNative()) {
          setReady(true)
          return
        }

        const done = await hasCompletedFirstRunPermissionFlow()
        if (cancelled) return

        if (done) {
          setReady(true)
          return
        }

        const notif = await checkNotificationPermission()
        if (cancelled) return

        if (notif === PERMISSION_STATE.PROMPT) {
          setStep(STEP.NOTIFICATION)
          return
        }

        const photos = await checkPhotosPermission()
        if (cancelled) return

        if (photos === PERMISSION_STATE.PROMPT) {
          setStep(STEP.PHOTOS)
          return
        }

        await markFirstRunPermissionFlowCompleted()
        setReady(true)
      } catch (e) {
        // 🔥 절대 앱 막지 않음
        console.warn('PermissionFlowGate error:', e)
        setReady(true)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  const finish = async () => {
    await markFirstRunPermissionFlowCompleted()
    setStep(STEP.DONE)
    setReady(true)
  }

  const handleAllowNotification = async () => {
    setLoading(true)
    try {
      await requestNotificationPermission()
    } finally {
      setLoading(false)
    }
    await finish()
  }

  const handleSkipNotification = async () => {
    await finish()
  }

  const handleAllowPhotos = async () => {
    setLoading(true)
    try {
      await requestPhotosPermission()
    } finally {
      setLoading(false)
    }
    await finish()
  }

  const handleSkipPhotos = async () => {
    await finish()
  }

  return (
    <>
      <PrePermissionSheet
        open={step === STEP.NOTIFICATION}
        loading={loading}
        icon="🔔"
        title="알림을 켜고 싶은 순간을 놓치지 마세요"
        description="허용하면 친구 요청, 댓글, 공지 알림을 받을 수 있어요."
        bullets={[
          '친구 요청 확인',
          '댓글·공감 알림',
          '학교 공지 알림',
        ]}
        primaryLabel="알림 허용"
        secondaryLabel="나중에"
        onAllow={handleAllowNotification}
        onDismiss={handleSkipNotification}
      />

      <PrePermissionSheet
        open={step === STEP.PHOTOS}
        loading={loading}
        icon="🖼️"
        title="사진을 함께 올려볼까요?"
        description="허용하면 갤러리 사진을 사용할 수 있어요."
        bullets={[
          '게시글 사진 첨부',
          '프로필 사진 변경',
          '갤러리 접근',
        ]}
        primaryLabel="사진 허용"
        secondaryLabel="나중에"
        onAllow={handleAllowPhotos}
        onDismiss={handleSkipPhotos}
      />

      {/* 🔥 중요: 항상 앱이 진행되도록 보장 */}
      {ready && step === STEP.DONE && null}
    </>
  )
}

export default PermissionFlowGate