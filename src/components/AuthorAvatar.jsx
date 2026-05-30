/**
 * Renders a live author avatar by looking up the uid in AuthorCacheContext.
 * Falls back to storedNickname / storedPhotoURL for anonymous or deleted users.
 */
import { memo } from 'react'
import { useAuthor } from '../context/AuthorCacheContext.jsx'

function AuthorAvatar({
  uid,
  isAnonymous = false,
  storedNickname = '',
  size = 36,
}) {
  const author = useAuthor(isAnonymous ? null : uid)
  const nickname = isAnonymous ? '익명' : (author?.nickname || storedNickname || '?')
  const photoURL = isAnonymous ? null : (author?.profilePhoto?.url || null)
  const initial = nickname[0] || '?'

  const sizeClass =
    size <= 28 ? 'h-7 w-7 text-[11px]' :
    size <= 32 ? 'h-8 w-8 text-[12px]' :
    size <= 36 ? 'h-9 w-9 text-[13px]' :
    'h-11 w-11 text-[14px]'

  if (photoURL) {
    return (
      <div className={`${sizeClass} flex-shrink-0 overflow-hidden rounded-full border border-mono-200/70 bg-mono-100`}>
        <img src={photoURL} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }
  return (
    <div className={`${sizeClass} flex flex-shrink-0 items-center justify-center rounded-full border border-mono-200/70 bg-mono-100 font-black text-ink`}>
      {initial}
    </div>
  )
}

// Memoized: re-renders only when uid/isAnonymous/storedNickname/size change,
// or when the author's profile loads (internal useAuthor state update).
export default memo(AuthorAvatar)
