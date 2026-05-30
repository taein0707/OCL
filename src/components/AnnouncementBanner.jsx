import { useEffect, useState } from 'react'
import { getRecentAnnouncements } from '../services/announcements.js'

const DISMISSED_KEY = 'ocl:dismissed-announcements'

const TYPE_STYLE = {
  alert:  'bg-red-50 border-red-200 text-red-800',
  event:  'bg-purple-50 border-purple-200 text-purple-800',
  update: 'bg-blue-50 border-blue-200 text-blue-800',
  notice: 'bg-amber-50 border-amber-200 text-amber-800',
}
const TYPE_LABEL = { alert: '긴급', event: '이벤트', update: '업데이트', notice: '공지' }

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
}
function addDismissed(id) {
  try {
    const list = getDismissed()
    if (!list.includes(id)) localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]))
  } catch {}
}

export default function AnnouncementBanner() {
  const [items, setItems] = useState([])

  useEffect(() => {
    getRecentAnnouncements(5).then((list) => {
      const dismissed = getDismissed()
      setItems(list.filter((a) => !dismissed.includes(a.id)))
    })
  }, [])

  const dismiss = (id) => {
    addDismissed(id)
    setItems((prev) => prev.filter((a) => a.id !== id))
  }

  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-2 px-4 pt-4">
      {items.map((a) => (
        <div
          key={a.id}
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${TYPE_STYLE[a.type] || TYPE_STYLE.notice}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                {TYPE_LABEL[a.type] || '공지'}
              </span>
              <span className="text-[13px] font-black leading-snug">{a.title}</span>
            </div>
            <p className="mt-0.5 text-[12px] font-medium leading-relaxed opacity-80 line-clamp-2">
              {a.body}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(a.id)}
            aria-label="공지 닫기"
            className="mt-0.5 shrink-0 opacity-50 hover:opacity-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
