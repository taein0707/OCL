export function getTimestampMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

export function formatTime(createdAt) {
  const ms = getTimestampMillis(createdAt)
  if (!ms) return ''

  const diff = Date.now() - ms
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return new Date(ms).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function toYmd(date = new Date()) {
  return date.toISOString().split('T')[0].replace(/-/g, '')
}

export function cleanMealMenuText(raw) {
  if (!raw) return ''
  return raw
    .split('<br/>')
    .map((s) => s.replace(/\([^)]*\)/g, '').replace(/[^가-힣\s]/g, '').trim())
    .filter(Boolean)
}

export function cleanMealMenuLine(raw) {
  if (!raw) return ''
  return raw.replace(/<br\/>/g, ', ').replace(/[^가-힣\s,]/g, '').trim()
}

export function maskNickname(name) {
  const maskedName = name || '친구'
  if (maskedName.length > 2) {
    return maskedName[0] + '*'.repeat(maskedName.length - 2) + maskedName[maskedName.length - 1]
  }
  if (maskedName.length === 2) {
    return maskedName[0] + '*'
  }
  return maskedName
}

export function isAppEnvironment() {
  return typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined'
}

export function getRegionFromAddress(address) {
  if (!address) return ''
  return address.split(' ').slice(0, 2).join(' ')
}
