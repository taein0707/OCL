import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function WarningPopup() {
  const { profile, firebaseUser } = useAuth()
  const warning = profile?.pendingWarning

  if (!warning || !firebaseUser?.uid) return null

  const handleAck = async () => {
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { pendingWarning: null })
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-[slideUpFade_0.3s_ease-out]">
        <div className="h-1 bg-red-500" />

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* 헤더 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">경고</p>
              <h2 className="text-[15px] font-black text-ink leading-snug">
                운영팀으로부터 경고가 도착했어요
              </h2>
            </div>
          </div>

          {/* 경고 내용 */}
          <div className="rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3">
            <p className="text-[13px] font-medium leading-relaxed text-mono-700">
              {warning.message || '커뮤니티 운영 정책 위반으로 경고를 받으셨습니다.'}
            </p>
          </div>

          <p className="text-center text-[11px] text-mono-400">
            반복 위반 시 계정이 정지될 수 있습니다.
          </p>

          <button
            type="button"
            onClick={handleAck}
            className="neo-btn w-full rounded-xl py-3 text-sm"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  )
}
