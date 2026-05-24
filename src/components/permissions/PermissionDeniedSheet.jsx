import { openAppSettings, getPlatformHint } from '../../utils/permissions.js'

const COPY = {
  camera: {
    icon: '📷',
    title: '카메라 권한이 필요해요',
    description: '사진 촬영 / 카메라 업로드 / QR 스캔 기능을 사용하려면 카메라 권한을 허용해 주세요.',
  },
  location: {
    icon: '📍',
    title: '위치 권한이 필요해요',
    description: '주변 학교, 지도 기능을 사용하려면 위치 권한을 허용해 주세요.',
  },
  photos: {
    icon: '🖼️',
    title: '사진 권한이 필요해요',
    description: '게시글에 이미지를 첨부하려면 사진 라이브러리 접근 권한을 허용해 주세요.',
  },
  notification: {
    icon: '🔔',
    title: '알림 권한이 필요해요',
    description: '댓글, 공지, 친구 요청 알림을 받으려면 알림 권한을 허용해 주세요.',
  },
}

function PermissionDeniedSheet({ open, kind, onClose }) {
  if (!open) return null
  const copy = COPY[kind] || {
    icon: '⚠️',
    title: '권한이 필요해요',
    description: '설정에서 이 권한을 허용해 주세요.',
  }

  const handleOpenSettings = async () => {
    const ok = await openAppSettings()
    if (!ok && typeof window !== 'undefined') {
      window.alert(getPlatformHint())
    }
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="relative z-[1] m-3 w-full max-w-sm rounded-3xl bg-white px-6 py-7 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.4)] sm:m-0">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mono-100 text-2xl">{copy.icon}</div>
          <div>
            <h2 className="text-base font-semibold text-mono-700">{copy.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-mono-500">{copy.description}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-mono-400">{getPlatformHint()}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleOpenSettings}
            className="w-full rounded-2xl bg-[var(--accent,#111)] py-3 text-sm font-semibold text-[var(--accent-foreground,#fff)]"
          >
            설정 열기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-mono-100 py-3 text-sm font-semibold text-mono-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default PermissionDeniedSheet
