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

/**
 * 앱 최초 실행 시 1회만 동작하는 권한 안내 게이트.
 *  순서:
 *   1. 알림 권한 안내 → 허용 시 시스템 팝업
 *   2. 사진 라이브러리 접근 권한 안내 → 허용 시 시스템 팝업
 *   3. 끝나면 first-run 완료 플래그 저장
 *
 *  카메라 / 위치는 여기서 요청하지 않는다. (사용 시점 트리거)
 */
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
    let cancelled = false

    const init = async () => {
      // 네이티브가 아니면 시스템 팝업이 의미 없으므로 게이트를 건너뛴다.
      if (!isNative()) return
      const done = await hasCompletedFirstRunPermissionFlow()
      if (done || cancelled) return

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
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [])

  const advanceAfterNotification = async () => {
    const photos = await checkPhotosPermission()
    if (photos === PERMISSION_STATE.PROMPT) {
      setStep(STEP.PHOTOS)
    } else {
      await markFirstRunPermissionFlowCompleted()
      setStep(STEP.DONE)
    }
  }

  const handleAllowNotification = async () => {
    setLoading(true)
    try {
      await requestNotificationPermission()
    } finally {
      setLoading(false)
    }
    await advanceAfterNotification()
  }

  const handleSkipNotification = async () => {
    await advanceAfterNotification()
  }

  const handleAllowPhotos = async () => {
    setLoading(true)
    try {
      await requestPhotosPermission()
    } finally {
      setLoading(false)
    }
    await markFirstRunPermissionFlowCompleted()
    setStep(STEP.DONE)
  }

  const handleSkipPhotos = async () => {
    await markFirstRunPermissionFlowCompleted()
    setStep(STEP.DONE)
  }

  return (
    <>
      <PrePermissionSheet
        open={step === STEP.NOTIFICATION}
        loading={loading}
        icon="🔔"
        title="알림을 켜고 싶은 순간을 놓치지 마세요"
        description="허용하면 친구 요청, 댓글, 공감, 공지 알림을 바로 받아볼 수 있어요."
        bullets={[
          '친구 요청을 바로 확인할 수 있어요',
          '내 게시글에 달린 댓글·공감을 알려드려요',
          '학교 공지·DM을 놓치지 않아요',
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
        description="허용하면 스냅 / 프로필에 갤러리 사진을 첨부할 수 있어요."
        bullets={[
          '스냅에 갤러리 사진을 바로 첨부할 수 있어요',
          '프로필 사진을 더 자유롭게 꾸밀 수 있어요',
          '필요한 사진만 선택해서 사용해요',
        ]}
        primaryLabel="사진 접근 허용"
        secondaryLabel="나중에"
        onAllow={handleAllowPhotos}
        onDismiss={handleSkipPhotos}
      />
    </>
  )
}

export default PermissionFlowGate
