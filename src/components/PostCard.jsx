import { useNavigate } from 'react-router-dom'
import { formatTime } from '../utils/index.js'

const previewStyle = {
  display: '-webkit-box',
  WebkitLineClamp: 10,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

function PostCard({ post, onToggleVibe }) {
  const navigate = useNavigate()
  const preview = post.content || post.excerpt || ''
  const canOpenProfile = !post.isAnonymous && Boolean(post.ownerUid || post.authorId)
  const targetUserId = post.ownerUid || post.authorId

  return (
    <article className="neo-card flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center gap-1.5">
        {(post.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-mono-200/70 bg-mono-100/80 px-2.5 py-0.5 text-[10.5px] font-bold text-mono-600"
          >
            {tag}
          </span>
        ))}
        <span className="ml-auto text-[11px] font-semibold text-mono-400">{formatTime(post.createdAt)}</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mono-400">{post.board}</p>
          <h3 className="sys-text mt-1.5 text-[17px] font-black leading-snug text-ink">{post.title}</h3>
        </div>

        <p className="text-[13.5px] font-medium leading-[1.65] text-mono-600" style={previewStyle}>
          {preview}
        </p>
      </div>

      <div className="flex items-end justify-between gap-3 pt-3 border-t border-mono-200/60">
        <button
          type="button"
          onClick={() => {
            if (!canOpenProfile) return
            navigate(`/users/${targetUserId}`)
          }}
          disabled={!canOpenProfile}
          className={`flex min-w-0 items-center gap-2.5 text-left ${canOpenProfile ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-mono-200/70 bg-mono-100 text-[13px] font-black text-ink">
            {post.author?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-black text-ink">{post.author}</p>
            <p className="truncate text-[11px] font-medium text-mono-400">
              {post.isAnonymous ? '익명 게시물' : post.schoolRegion || '우리 커뮤니티'}
            </p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={post.vibed ?? post.liked}
          onClick={() => onToggleVibe?.(post.id)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-black transition ${
            post.vibed ?? post.liked ? 'chip-active' : 'chip-idle'
          }`}
        >
          <span>{post.vibed ?? post.liked ? '공감했어' : '공감'}</span>
          <span>{post.vibes ?? post.likes}</span>
        </button>
      </div>
    </article>
  )
}

export default PostCard
