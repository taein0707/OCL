import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatTime } from '../utils/index.js'
import AuthorAvatar from './AuthorAvatar.jsx'
import { useAuthorInfo } from '../hooks/useAuthorName.js'

function QuestionCard({ post, postStyle = 'card' }) {
  const navigate = useNavigate()
  const solved = Boolean(post.solved)
  const ownerUid = post.ownerUid || post.authorId

  const { name: authorName } = useAuthorInfo(ownerUid, {
    isAnonymous: post.isAnonymous,
    storedNickname: post.author,
  })

  if (postStyle === 'mini') {
    return (
      <article
        className="neo-card flex items-center gap-3 px-4 py-3 cursor-pointer transition hover:bg-mono-50/60"
        onClick={() => navigate(`/post/${post.id}`)}
      >
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-black ${solved ? 'bg-green-100 text-green-700' : 'border border-mono-200 text-mono-500'}`}>
          {solved ? '해결됨' : 'Q&A'}
        </span>
        <h3 className="sys-text flex-1 truncate text-[14px] font-black text-ink">{post.title}</h3>
        <span className="shrink-0 text-xs font-semibold text-mono-400">{formatTime(post.createdAt)}</span>
      </article>
    )
  }

  return (
    <article
      className="neo-card flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6 cursor-pointer transition hover:bg-mono-50/60"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${solved ? 'bg-green-100 text-green-700' : 'bg-mono-100 text-mono-600'}`}>
          {solved ? '✓ 해결됨' : 'Q&A'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mono-400">{post.board}</p>
          <h3 className="sys-text mt-1 text-[17px] font-black leading-snug text-ink">{post.title}</h3>
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-mono-400 mt-0.5">{formatTime(post.createdAt)}</span>
      </div>

      {post.content ? (
        <p className="line-clamp-3 text-[13.5px] font-medium leading-[1.65] text-mono-600">{post.content}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-mono-200/60" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="flex items-center gap-2"
          onClick={() => { if (!post.isAnonymous && ownerUid) navigate(`/users/${ownerUid}`) }}
        >
          <AuthorAvatar uid={ownerUid} isAnonymous={post.isAnonymous} storedNickname={post.author} size={36} />
          <span className="text-[13px] font-black text-ink">{authorName}</span>
        </button>
        <span className="text-[12px] font-semibold text-mono-400">답변 {post.comments || 0}개</span>
      </div>
    </article>
  )
}

export default memo(QuestionCard)
