import { useRef, useState } from 'react'

function PlayCircle() {
  return (
    <svg viewBox="0 0 56 56" className="w-14 h-14 drop-shadow-xl" aria-hidden="true">
      <circle cx="28" cy="28" r="28" fill="rgba(0,0,0,0.52)" />
      <polygon points="22,16 44,28 22,40" fill="white" />
    </svg>
  )
}

export default function VideoPlayer({ src, thumbnailUrl, className = '' }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)

  const toggle = (e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (playing) {
      v.pause()
    } else {
      v.play().catch(() => {})
      setEnded(false)
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-black cursor-pointer select-none ${className}`}
      onClick={toggle}
    >
      <video
        ref={videoRef}
        src={src}
        poster={thumbnailUrl || undefined}
        playsInline
        preload="metadata"
        className="w-full object-cover max-h-[360px]"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setEnded(true) }}
      />
      {(!playing || ended) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <PlayCircle />
        </div>
      )}
    </div>
  )
}
