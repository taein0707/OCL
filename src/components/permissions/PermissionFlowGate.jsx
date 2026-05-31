import { useEffect, useState } from 'react'
import PrePermissionSheet from './PrePermissionSheet.jsx'
import { isNative } from '../../utils/platform.js'
import {
  PERMISSION_STATE,
  checkNotificationPermission,
  checkPhotosPermission,
  checkCameraPermission,
  requestNotificationPermission,
  requestPhotosPermission,
  requestCameraPermission,
  hasCompletedFirstRunPermissionFlow,
  markFirstRunPermissionFlowCompleted,
} from '../../utils/permissions.js'

const STEP = {
  IDLE: 'idle',
  NOTIFICATION: 'notification',
  PHOTOS: 'photos',
  CAMERA: 'camera',
  DONE: 'done',
}

// PROMPT 또는 UNSUPPORTED(플러그인 오류) 모두 요청 대상으로 처리.
// UNSUPPORTED를 건너뛰면 플로우가 UI 없이 완료 처리되어 다시는 안 뜨는 버그를 막는다.
function shouldAsk(state) {
  return state === PERMISSION_STATE.PROMPT || state === PERMISSION_STATE.UNSUPPORTED
}

function PermissionFlowGate() {
  const [step, setStep] = useState(STEP.IDLE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isNative()) return

    async function initFlow() {
      const alreadyDone = await hasCompletedFirstRunPermissionFlow()
      if (alreadyDone) return

      const [notifState, photosState, cameraState] = await Promise.all([
        checkNotificationPermission(),
        checkPhotosPermission(),
        checkCameraPermission(),
      ])

      if (shouldAsk(notifState)) {
        setStep(STEP.NOTIFICATION)
      } else if (shouldAsk(photosState)) {
        setStep(STEP.PHOTOS)
      } else if (shouldAsk(cameraState)) {
        setStep(STEP.CAMERA)
      } else {
        // 모두 이미 허용/거부된 경우 플로우 완료
        await markFirstRunPermissionFlowCompleted()
      }
    }

    initFlow()
  }, [])

  // 알림 처리 후 다음 단계 결정
  async function advanceAfterNotif() {
    const [photosState, cameraState] = await Promise.all([
      checkPhotosPermission(),
      checkCameraPermission(),
    ])
    if (shouldAsk(photosState)) {
      setStep(STEP.PHOTOS)
    } else if (shouldAsk(cameraState)) {
      setStep(STEP.CAMERA)
    } else {
      await markFirstRunPermissionFlowCompleted()
      setStep(STEP.DONE)
    }
  }

  // 사진 처리 후 다음 단계 결정
  async function advanceAfterPhotos() {
    const cameraState = await checkCameraPermission()
    if (shouldAsk(cameraState)) {
      setStep(STEP.CAMERA)
    } else {
      await markFirstRunPermissionFlowCompleted()
      setStep(STEP.DONE)
    }
  }

  // ── 알림 ──────────────────────────────────────────────────────
  const handleNotifAllow = async () => {
    setLoading(true)
    try { await requestNotificationPermission() } finally { setLoading(false) }
    await advanceAfterNotif()
  }

  const handleNotifDismiss = async () => {
    await advanceAfterNotif()
  }

  // ── 사진(앨범) ─────────────────────────────────────────────────
  const handlePhotosAllow = async () => {
    setLoading(true)
    try { await requestPhotosPermission() } finally { setLoading(false) }
    await advanceAfterPhotos()
  }

  const handlePhotosDismiss = async () => {
    await advanceAfterPhotos()
  }

  // ── 카메라 ─────────────────────────────────────────────────────
  const handleCameraAllow = async () => {
    setLoading(true)
    try { await requestCameraPermission() } finally { setLoading(false) }
    await markFirstRunPermissionFlowCompleted()
    setStep(STEP.DONE)
  }

  const handleCameraDismiss = async () => {
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
        title="앨범 접근을 허용해 주세요"
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

  if (step === STEP.CAMERA) {
    return (
      <PrePermissionSheet
        open
        icon="📷"
        title="카메라를 허용해 주세요"
        description="스냅에 직접 찍은 사진을 바로 올릴 수 있어요."
        bullets={[
          '게시글에 바로 찍어서 올릴 수 있어요',
          '프로필 사진을 카메라로 직접 찍어요',
        ]}
        loading={loading}
        onAllow={handleCameraAllow}
        onDismiss={handleCameraDismiss}
      />
    )
  }

  return null
}

export default PermissionFlowGate
