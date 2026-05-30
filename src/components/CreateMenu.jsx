import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ITEMS = [
  { type: 'post',     emoji: '✏️', label: '글쓰기',    desc: '스냅에 새 글 올리기' },
  { type: 'poll',     emoji: '📊', label: '투표 올리기', desc: '찬반·다중 투표 만들기' },
  { type: 'question', emoji: '💬', label: '질문하기',   desc: 'Q&A 질문 올리기' },
  { type: 'board',    emoji: '📌', label: '게시판 생성', desc: '새 게시판 열기' },
]

export default function CreateMenu({ open, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-[480px] rounded-t-[32px] border border-mono-200/60 bg-white/96 px-5 pt-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl backdrop-blur-md animate-[slideUpFade_0.22s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-mono-300" />

        <p className="mb-3 text-[10px] font-black tracking-[0.2em] text-mono-400">새로 만들기</p>

        <div className="flex flex-col gap-2">
          {ITEMS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => { onClose(); navigate('/create', { state: { type: item.type } }) }}
              className="flex items-center gap-4 rounded-2xl border border-mono-200/70 bg-mono-50/80 px-4 py-3.5 text-left transition active:scale-[0.98] active:bg-mono-100"
            >
              <span className="text-2xl leading-none">{item.emoji}</span>
              <div>
                <p className="text-[14px] font-black text-ink">{item.label}</p>
                <p className="mt-0.5 text-[11.5px] font-medium text-mono-500">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
