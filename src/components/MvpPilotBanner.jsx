import { MVP_PILOT_ENABLED } from '../constants/mvp.js'

function MvpPilotBanner() {
  if (!MVP_PILOT_ENABLED) return null

  return (
    <div className="neo-card px-4 py-3 border-ink bg-mono-100">
      <p className="font-black text-xs text-ink">MVP 시범 운영 중</p>
      <p className="font-bold text-[11px] text-ink-muted mt-1">
        학교 검색 · 동적 반 선택 · 앱 설정 즉시 반영 기능이 활성화되어 있습니다.
      </p>
    </div>
  )
}

export default MvpPilotBanner
