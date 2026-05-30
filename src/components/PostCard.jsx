import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatTime } from '../utils/index.js'
import MediaGallery from './MediaGallery.jsx'
import PollCard from './PollCard.jsx'
import QuestionCard from './QuestionCard.jsx'
import AuthorAvatar from './AuthorAvatar.jsx'
import { useAuthorInfo } from '../hooks/useAuthorName.js'

function HeartOutline({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function HeartFilled({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

const clamp10 = { display: '-webkit-box', WebkitLineClamp: 10, WebkitBoxOrient: 'vertical', overflow: 'hidden' }

function PostCard({ post, onToggleVibe, postStyle = 'card' }) {
  const navigate = useNavigate()

  // Route by type
  if (post.type === 'poll') return <PollCard post={post} postStyle={postStyle} />
  if (post.type === 'question') return <QuestionCard post={post} postStyle={postStyle} />

  const ownerUid = post.ownerUid || post.authorId
  const { name: authorName, photoURL: authorPhotoURL } = useAuthorInfo(ownerUid, {
    isAnonymous: post.isAnonymous,
    storedNickname: post.author,
  })

  const preview = post.content || post.excerpt || ''
  const canProfile = !post.isAnonymous && Boolean(ownerUid)
  const vibed = post.vibed ?? post.liked
  const media = post.mediaItems || []

  if (postStyle === 'mini') {
    return (
      <article
        className="neo-card flex items-center gap-3 px-4 py-3 cursor-pointer transition hover:bg-mono-50/60"
        onClick={() => navigate(`/post/${post.id}`)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-mono-400">{post.board}</p>
          <h3 className="sys-text truncate text-[14px] font-black text-ink">{post.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button" aria-pressed={vibed}
            onClick={() => onToggleVibe?.(post.id)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black transition ${vibed ? 'chip-active' : 'chip-idle'}`}
          >
            {vibed ? <HeartFilled className="w-3 h-3" /> : <HeartOutline className="w-3 h-3" />}
            <span>{post.vibes ?? post.likes}</span>
          </button>
          <span className="text-[11px] font-semibold text-mono-400">{formatTime(post.createdAt)}</span>
        </div>
      </article>
    )
  }

  if (postStyle === 'thumb') {
    return (
      <article
        className="neo-card flex flex-col gap-4 px-5 py-5 cursor-pointer transition hover:bg-mono-50/60"
        onClick={() => navigate(`/post/${post.id}`)}
      >
        {media.length > 0 && <MediaGallery items={media} compact />}
        <div className="flex flex-wrap items-center gap-1.5">
          {(post.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-mono-200/70 bg-mono-100/80 px-2.5 py-0.5 text-[10.5px] font-bold text-mono-600">{tag}</span>
          ))}
          <span className="ml-auto text-[11px] font-semibold text-mono-400">{formatTime(post.createdAt)}</span>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mono-400">{post.board}</p>
          <h3 className="sys-text mt-1 text-[20px] font-black leading-snug text-ink">{post.title}</h3>
        </div>
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-mono-200/60" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => canProfile && navigate(`/users/${ownerUid}`)}
            disabled={!canProfile}
            className={`flex min-w-0 items-center gap-2 text-left ${canProfile ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
          >
            <AuthorAvatar uid={ownerUid} isAnonymous={post.isAnonymous} storedNickname={post.author} size={32} />
            <p className="truncate text-[13px] font-black text-ink">{authorName}</p>
          </button>
          <button
            type="button" aria-pressed={vibed}
            onClick={() => onToggleVibe?.(post.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-black transition ${vibed ? 'chip-active' : 'chip-idle'}`}
          >
            {vibed ? <HeartFilled className="w-3.5 h-3.5" /> : <HeartOutline className="w-3.5 h-3.5" />}
            <span>{post.vibes ?? post.likes}</span>
          </button>
        </div>
      </article>
    )
  }

  // card (default)
  return (
    <article
      className="neo-card flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6 cursor-pointer transition hover:bg-mono-50/60"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {(post.tags || []).slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-mono-200/70 bg-mono-100/80 px-2.5 py-0.5 text-[10.5px] font-bold text-mono-600">{tag}</span>
        ))}
        <span className="ml-auto text-[11px] font-semibold text-mono-400">{formatTime(post.createdAt)}</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mono-400">{post.board}</p>
          <h3 className="sys-text mt-1.5 text-[17px] font-black leading-snug text-ink">{post.title}</h3>
        </div>
        {preview && (
          <p className="text-[13.5px] font-medium leading-[1.65] text-mono-600" style={clamp10}>{preview}</p>
        )}
        {media.length > 0 && <MediaGallery items={media} compact />}
      </div>

      <div className="flex items-end justify-between gap-3 pt-3 border-t border-mono-200/60" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => canProfile && navigate(`/users/${ownerUid}`)}
          disabled={!canProfile}
          className={`flex min-w-0 items-center gap-2.5 text-left ${canProfile ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
        >
          <AuthorAvatar uid={ownerUid} isAnonymous={post.isAnonymous} storedNickname={post.author} size={36} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-black text-ink">{authorName}</p>
            <p className="truncate text-[11px] font-medium text-mono-400">
              {post.isAnonymous ? '익명 게시물' : post.schoolRegion || post.schoolName || ''}
            </p>
          </div>
        </button>
        <button
          type="button" aria-pressed={vibed}
          onClick={() => onToggleVibe?.(post.id)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-black transition ${vibed ? 'chip-active' : 'chip-idle'}`}
        >
          {vibed ? <HeartFilled className="w-3.5 h-3.5" /> : <HeartOutline className="w-3.5 h-3.5" />}
          <span>{post.vibes ?? post.likes}</span>
        </button>
      </div>
    </article>
  )
}

// Memoized: only re-renders when post/onToggleVibe/postStyle actually change.
// Requires onToggleVibe to be stable (useCallback in parent).
export default memo(PostCard)
