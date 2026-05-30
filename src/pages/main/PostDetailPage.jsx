import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { ArrowLeftIcon } from '../../components/icons/TabIcons.jsx'
import { formatTime } from '../../utils/index.js'
import Toast from '../../components/Toast.jsx'
import AuthorAvatar from '../../components/AuthorAvatar.jsx'
import { useAuthorInfo } from '../../hooks/useAuthorName.js'
import { getPostById, getComments, addComment, addReply } from '../../services/community.js'
import { markPostSeen } from '../../services/feed.js'
import { reportPost } from '../../services/userProfile.js'

const REPORT_REASONS = ['스팸', '욕설/비방', '음란물', '개인정보 노출', '기타']

function HeartOutlineIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function HeartFilledIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function ShareIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function DotsIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  )
}

function FlagIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function ImageIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

// PostAuthorButton – uses live profile from cache
function PostAuthorButton({ ownerUid, post, canOpenProfile, onNavigate }) {
  const { name: authorName } = useAuthorInfo(ownerUid, {
    isAnonymous: post.isAnonymous,
    storedNickname: post.author,
  })
  return (
    <button
      type="button"
      disabled={!canOpenProfile}
      onClick={() => canOpenProfile && onNavigate()}
      className={`flex min-w-0 items-center gap-2.5 text-left ${canOpenProfile ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
    >
      <AuthorAvatar uid={ownerUid} isAnonymous={post.isAnonymous} storedNickname={post.author} size={36} />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-black text-ink">{authorName}</p>
        <p className="truncate text-[11px] font-medium text-mono-400">
          {post.isAnonymous ? '익명 게시물' : post.schoolRegion || post.schoolName || ''}
        </p>
      </div>
    </button>
  )
}

// CommenterAvatar delegates to AuthorAvatar for live profile data

function ReplyItem({ reply }) {
  const { name, photoURL } = useAuthorInfo(reply.authorUid, {
    isAnonymous: reply.isAnonymous,
    storedNickname: reply.authorNickname,
  })
  return (
    <div className="ml-11 flex items-start gap-3">
      <AuthorAvatar uid={reply.authorUid} isAnonymous={reply.isAnonymous} storedNickname={reply.authorNickname} size={28} />
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-black text-ink">{name}</p>
        <p className="mt-0.5 text-[12.5px] font-medium leading-[1.6] text-mono-700">{reply.content}</p>
        <span className="text-[10.5px] font-semibold text-mono-400">{formatTime(reply.createdAt)}</span>
      </div>
    </div>
  )
}

function CommentItem({ comment, currentUid, currentNickname, onReplySubmit }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyAnon, setReplyAnon] = useState(false)

  const { name: authorName } = useAuthorInfo(comment.authorUid, {
    isAnonymous: comment.isAnonymous,
    storedNickname: comment.authorNickname,
  })

  const handleReply = () => {
    if (!replyText.trim()) return
    onReplySubmit(comment.id, { content: replyText.trim(), isAnonymous: replyAnon })
    setReplyText('')
    setReplyOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <AuthorAvatar uid={comment.authorUid} isAnonymous={comment.isAnonymous} storedNickname={comment.authorNickname} size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-black text-ink">{authorName}</p>
          <p className="mt-0.5 text-[13px] font-medium leading-[1.65] text-mono-700">{comment.content}</p>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="text-[11px] font-semibold text-mono-400">{formatTime(comment.createdAt)}</span>
            <button
              type="button"
              onClick={() => setReplyOpen((p) => !p)}
              className="text-[11px] font-black text-mono-500 hover:text-ink"
            >
              대댓글
            </button>
          </div>
        </div>
      </div>

      {(comment.replies || []).map((r) => <ReplyItem key={r.id} reply={r} />)}

      {replyOpen && (
        <div className="ml-11 flex items-center gap-2">
          <input
            className="neo-input min-h-0 flex-1 py-2 text-sm"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="대댓글을 입력하세요"
            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
          />
          <button
            type="button"
            onClick={() => setReplyAnon((p) => !p)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black transition ${replyAnon ? 'chip-active' : 'chip-idle'}`}
          >
            익명
          </button>
          <button type="button" className="neo-btn min-h-0 shrink-0 rounded-xl px-3 py-2 text-xs" onClick={handleReply}>
            등록
          </button>
        </div>
      )}
    </div>
  )
}

function ReportModal({ post, currentProfile, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!reason) return
    setSubmitting(true)
    try {
      await reportPost({
        reporterUid: currentProfile?.uid || '',
        reportedUid: post.ownerUid || post.authorId || '',
        reportedNickname: post.author || '',
        school: currentProfile?.school || null,
        postId: post.id,
        reason,
      })
      onSuccess()
    } catch {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="neo-card w-full max-w-md flex flex-col gap-4 p-5 animate-[slideUpFade_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-[11px] font-black tracking-[0.18em] text-mono-500">신고</p>
          <h2 className="mt-1 text-xl font-black text-ink">신고 사유를 선택하세요</h2>
        </div>
        <div className="flex flex-col gap-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${reason === r ? 'option-active' : 'option-idle'}`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className="neo-btn flex-1" disabled={!reason || submitting} onClick={submit}>
            {submitting ? '처리 중...' : '신고하기'}
          </button>
          <button type="button" className="neo-btn-outline flex-1" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { profile, firebaseUser } = useAuth()
  const [post, setPost] = useState(undefined)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [isAnon, setIsAnon] = useState(false)
  const [toast, setToast] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [showDotsMenu, setShowDotsMenu] = useState(false)
  const dotsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getPostById(postId), getComments(postId)]).then(([p, c]) => {
      if (cancelled) return
      setPost(p)
      setComments(c)
      if (p) markPostSeen(firebaseUser?.uid, postId)
    })
    return () => { cancelled = true }
  }, [postId, firebaseUser?.uid])

  useEffect(() => {
    if (!showDotsMenu) return
    const handleClick = (e) => {
      if (dotsRef.current && !dotsRef.current.contains(e.target)) {
        setShowDotsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDotsMenu])

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    setCommentText('')
    const updated = await addComment(postId, {
      authorUid: firebaseUser?.uid || '',
      authorNickname: profile?.nickname || '익명',
      authorPhotoURL: profile?.profilePhoto?.url || null,
      isAnonymous: isAnon,
      content: commentText.trim(),
    })
    setComments(updated)
  }

  const handleAddReply = async (commentId, replyData) => {
    const updated = await addReply(postId, commentId, {
      authorUid: firebaseUser?.uid || '',
      authorNickname: profile?.nickname || '익명',
      authorPhotoURL: profile?.profilePhoto?.url || null,
      ...replyData,
    })
    setComments(updated)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${postId}`
    try {
      await navigator.clipboard.writeText(url)
      setToast('링크가 복사됐어요')
    } catch {
      setToast(`공유 링크: ${url}`)
    }
  }

  const handleImageSave = () => {
    setShowDotsMenu(false)
    try {
      const scale = 2
      const W = 600
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.font = '14px system-ui, -apple-system, sans-serif'
      const chars = (post.content || '').split('')
      const contentLines = []
      let line = ''
      for (const ch of chars) {
        const test = line + ch
        if (tempCtx.measureText(test).width > W - 48) {
          contentLines.push(line)
          line = ch
        } else {
          line = test
        }
      }
      if (line) contentLines.push(line)

      const H = Math.max(220, 110 + contentLines.length * 22 + 56)
      const canvas = document.createElement('canvas')
      canvas.width = W * scale
      canvas.height = H * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#e5e5e5'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, W, H)

      ctx.fillStyle = '#000000'
      ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
      ctx.fillText(post.title || '', 24, 42)

      ctx.strokeStyle = '#f0f0f0'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(24, 56); ctx.lineTo(W - 24, 56); ctx.stroke()

      ctx.fillStyle = '#444444'
      ctx.font = '14px system-ui, -apple-system, sans-serif'
      contentLines.forEach((l, i) => ctx.fillText(l, 24, 76 + i * 22))

      const footerY = H - 38
      ctx.strokeStyle = '#f0f0f0'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(24, footerY); ctx.lineTo(W - 24, footerY); ctx.stroke()

      ctx.fillStyle = '#aaaaaa'
      ctx.font = '11px system-ui, -apple-system, sans-serif'
      ctx.fillText(`${post.author || '익명'} · ${post.board || ''} · OCL`, 24, H - 18)

      canvas.toBlob((blob) => {
        if (!blob) { setToast('이미지 저장에 실패했어요'); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ocl-post-${postId}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setToast('이미지가 저장됐어요')
      }, 'image/png')
    } catch {
      setToast('이미지 저장에 실패했어요')
    }
  }

  if (post === undefined) {
    return (
      <div className="flex flex-col gap-4 animate-[slideUpFade_0.3s_ease-out]">
        <button type="button" onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-mono-200 bg-white text-ink transition hover:bg-mono-100">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="neo-card flex items-center gap-3 p-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-mono-200 border-t-[var(--accent)]" />
          <span className="text-sm font-semibold text-mono-500">게시물을 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (post === null) {
    return (
      <div className="flex flex-col gap-4 animate-[slideUpFade_0.3s_ease-out]">
        <button type="button" onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-mono-200 bg-white text-ink transition hover:bg-mono-100">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="neo-card p-6 text-sm font-semibold text-mono-500">게시물을 찾을 수 없어요.</div>
      </div>
    )
  }

  const ownerUid = post.ownerUid || post.authorId
  const canOpenProfile = !post.isAnonymous && Boolean(ownerUid)

  return (
    <div className="flex flex-col gap-5 pb-24 animate-[slideUpFade_0.3s_ease-out]">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-mono-200 bg-white text-ink transition hover:bg-mono-100"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-[11px] font-black tracking-[0.18em] text-mono-500">게시물</p>
          <h1 className="sys-text text-xl font-black text-ink">상세 보기</h1>
        </div>

        <div className="relative" ref={dotsRef}>
          <button
            type="button"
            onClick={() => setShowDotsMenu((p) => !p)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-mono-200 bg-white text-ink transition hover:bg-mono-100"
          >
            <DotsIcon className="w-5 h-5" />
          </button>
          {showDotsMenu && (
            <div className="absolute right-0 top-12 z-50 w-40 neo-card flex flex-col overflow-hidden p-1 animate-[slideUpFade_0.15s_ease-out]">
              <button
                type="button"
                onClick={handleImageSave}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-black text-ink transition hover:bg-mono-100"
              >
                <ImageIcon className="w-4 h-4" />
                이미지로 저장
              </button>
              <button
                type="button"
                onClick={() => { setShowDotsMenu(false); setShowReport(true) }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-black text-red-500 transition hover:bg-mono-100"
              >
                <FlagIcon className="w-4 h-4" />
                신고
              </button>
            </div>
          )}
        </div>
      </header>

      <article className="neo-card flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {(post.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-mono-200/70 bg-mono-100/80 px-2.5 py-0.5 text-[10.5px] font-bold text-mono-600">
              {tag}
            </span>
          ))}
          <span className="ml-auto text-[11px] font-semibold text-mono-400">{formatTime(post.createdAt)}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mono-400">{post.board}</p>
          <h2 className="sys-text text-[18px] font-black leading-snug text-ink">{post.title}</h2>
          <p className="text-[13.5px] font-medium leading-[1.7] text-mono-600">{post.content}</p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-mono-200/60">
          <PostAuthorButton
            ownerUid={ownerUid}
            post={post}
            canOpenProfile={canOpenProfile}
            onNavigate={() => navigate(`/users/${ownerUid}`)}
          />

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-mono-200 bg-mono-50 px-3 py-1.5 text-[12.5px] font-black text-mono-600">
              {post.vibed ? <HeartFilledIcon className="w-3.5 h-3.5" /> : <HeartOutlineIcon className="w-3.5 h-3.5" />}
              <span>{post.vibes ?? post.likes ?? 0}</span>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-mono-200 bg-mono-50 px-3 py-1.5 text-[12px] font-black text-ink transition hover:bg-mono-100"
            >
              <ShareIcon className="w-3.5 h-3.5" />
              공유
            </button>
          </div>
        </div>
      </article>

      <section className="flex flex-col gap-4">
        <h3 className="text-base font-black text-ink">
          댓글 <span className="text-mono-400">{comments.length}</span>
        </h3>

        {comments.length === 0 && (
          <div className="neo-card p-5 text-sm font-semibold text-mono-500">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</div>
        )}

        <div className="flex flex-col gap-4">
          {comments.map((c) => (
            <div key={c.id} className="neo-card p-4">
              <CommentItem
                comment={c}
                currentUid={firebaseUser?.uid}
                currentNickname={profile?.nickname}
                onReplySubmit={handleAddReply}
              />
            </div>
          ))}
        </div>

        <div className="neo-card flex items-center gap-2 p-3">
          <input
            className="neo-input min-h-0 flex-1 py-2.5 text-sm"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요"
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button
            type="button"
            onClick={() => setIsAnon((p) => !p)}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black transition ${isAnon ? 'chip-active' : 'chip-idle'}`}
          >
            익명
          </button>
          <button
            type="button"
            onClick={handleAddComment}
            className="neo-btn min-h-0 shrink-0 rounded-xl px-4 py-2.5 text-sm"
          >
            등록
          </button>
        </div>
      </section>

      {showReport && (
        <ReportModal
          post={post}
          currentProfile={profile}
          onClose={() => setShowReport(false)}
          onSuccess={() => {
            setShowReport(false)
            setToast('신고가 접수됐어요')
          }}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

export default PostDetailPage
