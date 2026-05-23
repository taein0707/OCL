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
    <article className="neo-card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        {(post.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-mono-200 bg-mono-100 px-2.5 py-1 text-[11px] font-black text-ink"
          >
            {tag}
          </span>
        ))}
        <span className="ml-auto text-xs font-bold text-mono-500">{formatTime(post.createdAt)}</span>
      </div>

      <div className="flex flex-col gap-3">
        <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mono-500">{post.board}</p>
            <h3 className="sys-text mt-2 text-xl font-black text-ink">{post.title}</h3>
          </div>

        <p className="text-sm font-semibold leading-6 text-mono-600" style={previewStyle}>
          {preview}
        </p>
      </div>

      <div className="flex items-end justify-between gap-3 border-t border-mono-200 pt-4">
        <button
          type="button"
          onClick={() => {
            if (!canOpenProfile) return
            navigate(`/users/${targetUserId}`)
          }}
          disabled={!canOpenProfile}
          className={`flex min-w-0 items-center gap-3 text-left ${canOpenProfile ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-mono-200 bg-mono-100 text-sm font-black text-ink">
            {post.author?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-ink">{post.author}</p>
            <p className="truncate text-xs font-semibold text-mono-500">
              {post.isAnonymous ? '익명 게시물' : post.schoolRegion || '우리 커뮤니티'}
            </p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={post.vibed ?? post.liked}
          onClick={() => onToggleVibe?.(post.id)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-black transition ${
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
