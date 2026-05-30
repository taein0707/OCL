import { useNavigate } from 'react-router-dom'
import { formatTime } from '../../utils/index.js'

function ProfilePostList({ posts, showAnonymousBadge = false }) {
  const navigate = useNavigate()
  return (
    <ul className="flex flex-col gap-2.5">
      {posts.map((post, index) => (
        <li
          key={post.id}
          className="neo-card animate-[slideUpFade_0.3s_ease-out] cursor-pointer transition hover:bg-mono-50/60"
          style={{ animationDelay: `${Math.min(index * 30, 180)}ms` }}
          onClick={() => navigate(`/post/${post.id}`)}
        >
          <article className="flex flex-col gap-2 px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="sys-text line-clamp-2 text-[14.5px] font-black leading-snug text-ink">{post.title}</h3>
              {showAnonymousBadge && post.isAnonymous && (
                <span className="shrink-0 rounded-full border border-mono-200/70 bg-mono-100 px-2 py-0.5 text-[9.5px] font-black text-mono-500">
                  익명
                </span>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-mono-400">
              <span>{formatTime(post.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <span>공감 {post.vibes ?? post.likes ?? 0}</span>
              <span aria-hidden="true">·</span>
              <span>댓글 {post.comments ?? 0}</span>
            </p>
          </article>
        </li>
      ))}
    </ul>
  )
}

export default ProfilePostList
