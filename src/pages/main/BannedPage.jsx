import { useAuth } from '../../context/AuthContext.jsx'

function BannedPage({ type = 'permanent' }) {
  const { profile, logout } = useAuth()
  const isPermanent = type === 'permanent'

  const suspendedUntil = profile?.suspendedUntil?.toDate?.()
  const formattedDate = suspendedUntil
    ? suspendedUntil.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-mono-100 px-4 py-10">
      <div className="neo-card flex w-full max-w-md flex-col items-center gap-6 px-7 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-mono-200 bg-mono-50">
          <svg className="h-10 w-10 text-mono-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {isPermanent ? (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </>
            )}
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mono-500">
            {isPermanent ? '계정 정지' : '일시 정지'}
          </p>
          <h1 className="sys-text text-2xl font-black text-ink">
            {isPermanent ? '계정이 영구 정지됐어요' : '계정이 일시 정지됐어요'}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-[1.7] text-mono-500">
            {isPermanent
              ? '커뮤니티 운영 정책 위반으로 계정이 영구 정지됐습니다. 이의가 있으시면 고객센터에 문의해 주세요.'
              : '커뮤니티 운영 정책 위반으로 계정이 일시 정지됐습니다. 정지 기간이 끝난 후 다시 이용할 수 있어요.'}
          </p>
        </div>

        {!isPermanent && (
          <div className="w-full rounded-2xl border border-mono-200 bg-mono-50 px-5 py-4 text-sm font-semibold text-mono-600">
            {formattedDate ? (
              <>
                <p className="text-xs text-mono-400">정지 해제일</p>
                <p className="mt-1 font-black text-ink">{formattedDate}</p>
              </>
            ) : (
              '정지 기간 정보를 불러오는 중...'
            )}
          </div>
        )}

        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            className="neo-btn-outline w-full rounded-2xl py-3 text-sm"
            onClick={() => window.open('mailto:support@ocl-lounge.app', '_blank')}
          >
            고객센터 문의
          </button>
          <button
            type="button"
            className="w-full rounded-2xl py-3 text-sm font-semibold text-mono-400 hover:text-mono-600"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}

export default BannedPage
