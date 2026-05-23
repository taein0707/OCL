import { formatTime } from '../../utils/index.js'

function ProfilePostList({ posts, showAnonymousBadge = false }) {
  return (
    <ul className="flex flex-col gap-3">
      {posts.map((post, index) => (
        <li
          key={post.id}
          className="neo-card animate-[slideUpFade_0.3s_ease-out]"
          style={{ animationDelay: `${Math.min(index * 30, 180)}ms` }}
        >
          <article className="flex flex-col gap-2 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="sys-text line-clamp-2 text-base font-black text-ink">{post.title}</h3>
              {showAnonymousBadge && post.isAnonymous && (
                <span className="shrink-0 rounded-full border border-mono-200 bg-mono-100 px-2 py-0.5 text-[10px] font-black text-mono-500">
                  익명
                </span>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-mono-500">
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
