import { memo, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { votePoll, getUserPollVote } from '../services/community.js'
import { formatTime } from '../utils/index.js'
import AuthorAvatar from './AuthorAvatar.jsx'
import { useAuthorInfo } from '../hooks/useAuthorName.js'

function PollCard({ post, postStyle = 'card' }) {
  const { firebaseUser } = useAuth()
  const uid = firebaseUser?.uid
  const ownerUid = post.ownerUid || post.authorId

  const { name: authorName } = useAuthorInfo(ownerUid, {
    isAnonymous: post.isAnonymous,
    storedNickname: post.author,
  })

  const [options, setOptions] = useState(post.pollOptions || [])
  const [total, setTotal] = useState(post.totalVotes || 0)
  const [userVote, setUserVote] = useState(null)
  const [voting, setVoting] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!uid || !post.id || loadedRef.current) return
    loadedRef.current = true
    getUserPollVote(post.id, uid).then((idx) => { if (idx !== null) setUserVote(idx) })
  }, [post.id, uid])

  const hasVoted = userVote !== null
  const pct = (count) => (total > 0 ? Math.round((count / total) * 100) : 0)

  const handleVote = async (i) => {
    if (hasVoted || voting || !uid) return
    setVoting(true)
    setUserVote(i)
    setOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, voteCount: (o.voteCount || 0) + 1 } : o))
    setTotal((t) => t + 1)
    await votePoll(post.id, i, uid)
    setVoting(false)
  }

  if (postStyle === 'mini') {
    return (
      <article className="neo-card flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-black tracking-[0.15em]" style={{ color: 'var(--accent)' }}>POLL</span>
          <h3 className="sys-text truncate text-[14px] font-black text-ink">{post.title}</h3>
        </div>
        <span className="shrink-0 text-xs font-semibold text-mono-400">{formatTime(post.createdAt)}</span>
      </article>
    )
  }

  return (
    <article className="neo-card flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em]" style={{ color: 'var(--accent)' }}>POLL</span>
          <h3 className="sys-text mt-1 text-[17px] font-black leading-snug text-ink">{post.title}</h3>
          {post.content ? <p className="mt-1.5 text-[13px] font-medium text-mono-500">{post.content}</p> : null}
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-mono-400">{formatTime(post.createdAt)}</span>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const p = hasVoted ? pct(opt.voteCount || 0) : 0
          const chosen = userVote === i
          return (
            <button
              key={i}
              type="button"
              disabled={hasVoted || voting}
              onClick={() => handleVote(i)}
              className={`relative overflow-hidden rounded-xl border px-4 py-3 text-left transition ${
                chosen ? 'border-[var(--accent)]' :
                hasVoted ? 'border-mono-200 bg-mono-50 cursor-default' :
                'border-mono-200 bg-white hover:border-mono-300 active:bg-mono-50'
              }`}
              style={chosen ? { backgroundColor: 'var(--accent-soft)' } : {}}
            >
              {hasVoted && (
                <div className="absolute inset-y-0 left-0 rounded-xl opacity-[0.18] pointer-events-none"
                  style={{ width: `${p}%`, background: 'var(--accent)' }} />
              )}
              <div className="relative flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-black text-ink">{opt.text}</span>
                {hasVoted && (
                  <span className="text-[13px] font-black shrink-0"
                    style={chosen ? { color: 'var(--accent)' } : { color: '#888' }}>
                    {p}%{chosen && ' ✓'}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-mono-200/60">
        <div className="flex items-center gap-2">
          <AuthorAvatar uid={ownerUid} isAnonymous={post.isAnonymous} storedNickname={post.author} size={32} />
          <span className="text-[13px] font-black text-mono-600">{authorName}</span>
        </div>
        <span className="text-[12px] font-semibold text-mono-400">총 {total}표</span>
      </div>
    </article>
  )
}

export default memo(PollCard)
