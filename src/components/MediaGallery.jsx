import { useState } from 'react'
import VideoPlayer from './VideoPlayer.jsx'

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function MediaGallery({ items = [], compact = false }) {
  const [lightboxIdx, setLightboxIdx] = useState(null)
  if (!items.length) return null

  const images = items.filter((m) => m.type === 'image')
  const videos = items.filter((m) => m.type === 'video')

  const gridCols =
    images.length === 1 ? 'grid-cols-1' :
    images.length === 2 ? 'grid-cols-2' :
    'grid-cols-3'

  const displayImages = compact ? images.slice(0, 3) : images

  return (
    <>
      <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        {videos.map((item, i) => (
          <VideoPlayer
            key={i}
            src={item.url}
            thumbnailUrl={item.thumbnailUrl}
          />
        ))}

        {images.length > 0 && (
          <div className={`grid gap-1.5 ${gridCols}`}>
            {displayImages.map((item, i) => {
              const isLast = compact && i === 2 && images.length > 3
              return (
                <button
                  key={i}
                  type="button"
                  className="relative aspect-square overflow-hidden rounded-xl bg-mono-100"
                  onClick={() => setLightboxIdx(i)}
                >
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                  {isLast && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-xl font-black text-white">+{images.length - 3}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxIdx(null)}
          >
            <CloseIcon />
          </button>
          <img
            src={images[lightboxIdx]?.url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(i) }}
                  className={`h-1.5 rounded-full transition-all ${i === lightboxIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
