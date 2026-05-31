import { useEffect, useRef, useState } from 'react'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { dispatchLocalNotification } from '../utils/notifications.js'

const DISMISSED_KEY = 'ocl:dismissed-announcements'

const TYPE_LABEL = { alert: '긴급', event: '이벤트', update: '업데이트', notice: '공지' }
const TYPE_DOT = {
  alert: 'bg-red-500',
  event: 'bg-purple-500',
  update: 'bg-blue-500',
  notice: 'bg-amber-500',
}
const TYPE_TEXT = {
  alert: 'text-red-600',
  event: 'text-purple-600',
  update: 'text-blue-500',
  notice: 'text-amber-600',
}

function getDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')) } catch { return new Set() }
}
function addDismissed(id) {
  try {
    const arr = [...getDismissed(), id]
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr))
  } catch {}
}

export default function AnnouncementBanner() {
  const [queue, setQueue] = useState([])
  const [expanded, setExpanded] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(5)),
      (snap) => {
        const dismissed = getDismissed()
        const items = snap.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .filter((a) => !dismissed.has(a.id))

        setQueue((prev) => {
          const prevIds = new Set(prev.map((a) => a.id))
          if (initializedRef.current) {
            items
              .filter((a) => !prevIds.has(a.id))
              .forEach((a) => {
                dispatchLocalNotification({
                  title: `[${TYPE_LABEL[a.type] || '공지'}] ${a.title}`,
                  body: a.body,
                })
              })
          }
          initializedRef.current = true
          return items
        })
      },
    )
    return unsub
  }, [])

  const current = queue[0]

  const dismiss = () => {
    if (!current) return
    addDismissed(current.id)
    setQueue((prev) => prev.filter((a) => a.id !== current.id))
    setExpanded(false)
  }

  if (!current) return null

  const body = current.body || ''
  const isLong = body.length > 100
  const displayBody = expanded || !isLong ? body : body.slice(0, 100) + '…'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-[slideUpFade_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-[var(--accent)]" />

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${TYPE_DOT[current.type] || TYPE_DOT.notice}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${TYPE_TEXT[current.type] || TYPE_TEXT.notice}`}>
                  {TYPE_LABEL[current.type] || '공지'}
                </span>
              </div>
              <h2 className="text-[15px] font-black text-ink leading-snug">
                {current.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="닫기"
              className="mt-0.5 shrink-0 flex h-7 w-7 items-center justify-center rounded-full hover:bg-mono-100 text-mono-400 transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 내용 */}
          <p className="text-[13px] font-medium leading-relaxed text-mono-600">
            {displayBody}
          </p>

          {/* 더보기 + 확인 버튼 */}
          <div className="flex items-center justify-between gap-2">
            {isLong ? (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="text-[12px] font-black text-[var(--accent)] transition hover:opacity-70"
              >
                {expanded ? '접기' : '더보기'}
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              {queue.length > 1 && (
                <span className="text-[11px] text-mono-400">
                  1 / {queue.length}
                </span>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="neo-btn min-h-0 rounded-xl px-5 py-2 text-sm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
