/**
 * 알림 설정 가능 여부 및 기본 저장소
 * - 웹: Notification API + localStorage
 * - RN WebView: postMessage로 네이티브 FCM 위임 (레거시 호환)
 */

const STORAGE_KEY = 'ocl_notif_settings'

export const DEFAULT_NOTIF_SETTINGS = {
  comments: true,
  likes: true,
  reaction: true,
  recommendation: true,
  meal: true,
}

// ─── 알림 템플릿 ────────────────────────────────────────────────────────────
// 1) 친구 요청 발생 시
export const NOTIF_TEMPLATES = {
  friendRequest: (requesterId) => ({
    title: '새로운 친구 요청이 왔습니다',
    body: `${requesterId}가 친구를 요청했습니다.`,
  }),

  // 2) 공감 수 10의 배수 달성 시 (shouldTriggerVibeMilestone 조건과 함께 사용)
  vibeMilestone: (count) => ({
    title: '새로운 하트가 눌렸습니다',
    body: `내 게시글의 좋아요가 ${count}개가 되었습니다`,
  }),

  // 3) 아침 8:30 스케줄러 알림
  morningReminder: (mealItems = []) => ({
    title: '오늘 우리 반 시간표와 급식표입니다',
    body: `${mealItems.join('\n')}\n알림을 눌러 시간표를 확인하세요`,
  }),
}

/**
 * 아침 8:30 푸시 스케줄러 페이로드 규격
 * 서버 스케줄러(Cloud Functions / cron)에서 매일 오전 8:30에 FCM/APNs로 발송.
 *
 * {
 *   notification: {
 *     title: '오늘 우리 반 시간표와 급식표입니다',
 *     body: '{메뉴1}\n{메뉴2}\n...\n알림을 눌러 시간표를 확인하세요'
 *   },
 *   data: {
 *     type: 'MORNING_CLASS_REMINDER',
 *     targetRoute: '/class',
 *     scheduledAt: 'YYYY-MM-DDTHH:mm:ss+09:00'
 *   }
 * }
 *
 * 발송 조건:
 *   - 평일(월–금) 오전 8:30 KST
 *   - 사용자의 meal 알림 설정이 true인 경우만 개인 발송
 */
// ───────────────────────────────────────────────────────────────────────────

/**
 * 공감 수가 10의 배수로 넘어갈 때만 true를 반환합니다.
 * community.js의 toggleCommunityPostVibe에서 이 함수를 사용해 트리거 시점을 결정합니다.
 */
export function shouldTriggerVibeMilestone(prevVibes, nextVibes) {
  return nextVibes > prevVibes && nextVibes > 0 && nextVibes % 10 === 0
}

export function canConfigureNotifications() {
  if (typeof window === 'undefined') return false
  if (typeof window.ReactNativeWebView !== 'undefined') return true
  return 'Notification' in window
}

export function loadNotifSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_NOTIF_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_NOTIF_SETTINGS }
  } catch {
    return { ...DEFAULT_NOTIF_SETTINGS }
  }
}

export function saveNotifSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function requestNotificationPermission() {
  if (typeof window.ReactNativeWebView !== 'undefined') {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'REQUEST_NOTIFICATION_PERMISSION' }),
    )
    return Promise.resolve('native-delegated')
  }
  if ('Notification' in window) {
    return Notification.requestPermission()
  }
  return Promise.resolve('unsupported')
}

export function dispatchLocalNotification({ title, body }) {
  if (typeof window === 'undefined') return

  if (typeof window.ReactNativeWebView !== 'undefined') {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'PUSH_NOTIFICATION', payload: { title, body } }),
    )
    return
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}
