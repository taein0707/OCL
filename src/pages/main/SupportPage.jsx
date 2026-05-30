import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/index.js'
import { useAuth } from '../../context/AuthContext.jsx'

const CATEGORIES = ['서비스 이용 문의', '계정/로그인 문제', '계정 정지 이의신청', '신고 관련', '버그 신고', '기타']

const FAQ = [
  {
    q: '계정이 정지된 이유를 알 수 있나요?',
    a: '커뮤니티 운영 정책 위반이 확인된 경우 정지 조치가 이뤄집니다. 이의가 있으시면 아래 양식으로 문의해 주세요.',
  },
  {
    q: '일시 정지는 언제 해제되나요?',
    a: '정지 화면에 표시된 해제일에 자동으로 해제됩니다. 앱을 재실행하면 바로 이용하실 수 있어요.',
  },
  {
    q: '비밀번호를 잊었어요.',
    a: '로그인 화면에서 비밀번호 재설정 이메일을 요청할 수 있습니다.',
  },
  {
    q: '내 게시글/댓글이 삭제됐어요.',
    a: '운영 정책에 위반되는 내용은 관리자가 삭제할 수 있습니다. 문제가 있다고 생각되면 아래 문의를 남겨 주세요.',
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-mono-200 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-1 py-4 text-left text-sm font-black text-ink"
      >
        <span>{q}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-mono-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <p className="px-1 pb-4 text-[13px] font-medium leading-relaxed text-mono-500">{a}</p>}
    </div>
  )
}

export default function SupportPage() {
  const { profile, firebaseUser } = useAuth()
  const navigate = useNavigate()
  const [category, setCategory] = useState(CATEGORIES[0])
  const [name, setName] = useState(profile?.nickname || '')
  const [email, setEmail] = useState(firebaseUser?.email?.replace(/@ocl-lounge\.app$/, '') || '')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await addDoc(collection(db, 'inquiries'), {
        uid: firebaseUser?.uid || null,
        nickname: name.trim() || '익명',
        email: email.trim() || null,
        category,
        body: body.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setDone(true)
    } catch (err) {
      console.error('[support]', err)
      setError('문의 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl animate-[slideUpFade_0.3s_ease-out]">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-mono-100"
        >
          <svg className="h-5 w-5 text-mono-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-mono-400">고객센터</p>
          <h1 className="text-xl font-black text-ink">문의하기</h1>
        </div>
      </div>

      {/* FAQ */}
      <section className="neo-card mb-6 px-5 py-2">
        <p className="py-3 text-[11px] font-black uppercase tracking-widest text-mono-400">자주 묻는 질문</p>
        {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
      </section>

      {/* 문의 폼 */}
      <section className="neo-card px-5 py-6">
        <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-mono-400">직접 문의</p>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl">✓</div>
            <p className="text-base font-black text-ink">문의가 접수됐어요</p>
            <p className="text-[13px] font-medium text-mono-500">운영팀이 확인 후 처리해 드릴게요.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="neo-btn-outline mt-2 rounded-2xl px-6 py-2.5 text-sm"
            >
              돌아가기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-black text-mono-500">문의 유형</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="neo-input w-full text-sm"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-black text-mono-500">닉네임</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="닉네임"
                  className="neo-input w-full text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black text-mono-500">연락 이메일 (선택)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="답변 받을 이메일"
                  className="neo-input w-full text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black text-mono-500">문의 내용 <span className="text-red-500">*</span></label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={5}
                placeholder="문의 내용을 자세히 적어 주세요."
                className="neo-input w-full resize-none text-sm"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="neo-btn w-full rounded-2xl py-3 text-sm disabled:opacity-50"
            >
              {submitting ? '접수 중…' : '문의 접수하기'}
            </button>

            <p className="text-center text-[11px] text-mono-400">
              또는{' '}
              <a href="mailto:support@ocl-lounge.app" className="underline">
                support@ocl-lounge.app
              </a>
              {' '}으로 직접 이메일 보내기
            </p>
          </form>
        )}
      </section>
    </div>
  )
}
