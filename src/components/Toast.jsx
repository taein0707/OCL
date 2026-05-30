import { useEffect } from 'react'

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500)
    return () => clearTimeout(t)
  }, [onClose])

  if (!message) return null

  return (
    <div className="fixed bottom-24 left-1/2 z-[200] -translate-x-1/2 animate-[slideUpFade_0.3s_ease-out]">
      <div className="rounded-2xl border border-mono-200 bg-white px-5 py-3 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.28)]">
        <p className="whitespace-nowrap text-sm font-black text-ink">{message}</p>
      </div>
    </div>
  )
}

export default Toast
