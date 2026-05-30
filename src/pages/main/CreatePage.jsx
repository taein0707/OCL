import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import FieldError from '../../components/FieldError.jsx'
import VideoPlayer from '../../components/VideoPlayer.jsx'
import {
  createCommunityPost,
  createPollPost,
  createQuestionPost,
  createBoard,
  getCommunityBoards,
} from '../../services/community.js'
import { uploadMediaFiles, validateVideoFile, validateImageFile, MAX_VIDEO_SECONDS } from '../../services/mediaUpload.js'

const TYPE_TABS = [
  { id: 'post',     label: '글쓰기',    emoji: '✏️' },
  { id: 'poll',     label: '투표',      emoji: '📊' },
  { id: 'question', label: 'Q&A',       emoji: '💬' },
  { id: 'board',    label: '게시판 생성', emoji: '📌' },
]

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ImgIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  )
}

export default function CreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()

  const initType = location.state?.type || 'post'
  const [activeType, setActiveType] = useState(initType)
  const boards = useMemo(() => getCommunityBoards(profile), [profile])

  // shared
  const [selectedBoard, setSelectedBoard] = useState(boards[0] || '자유')
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)

  // post / question
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // media
  const [mediaPreviews, setMediaPreviews] = useState([]) // { file, localUrl, type }
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)

  // poll
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])

  // board
  const [boardName, setBoardName] = useState('')
  const [boardDesc, setBoardDesc] = useState('')
  const [boardPublic, setBoardPublic] = useState(true)
  const [boardSchool, setBoardSchool] = useState(false)

  const switchType = (t) => {
    setActiveType(t)
    setError('')
  }

  const addMedia = useCallback(async (files, kind) => {
    setError('')
    const arr = Array.from(files)
    const validated = []
    for (const file of arr) {
      try {
        if (kind === 'video') {
          await validateVideoFile(file)
        } else {
          validateImageFile(file)
        }
        validated.push({
          file,
          localUrl: URL.createObjectURL(file),
          type: kind,
        })
      } catch (err) {
        setError(err.message)
        return
      }
    }
    setMediaPreviews((prev) => [...prev, ...validated])
  }, [])

  const removeMedia = useCallback((idx) => {
    setMediaPreviews((prev) => {
      URL.revokeObjectURL(prev[idx].localUrl)
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  const setPollOption = (i, val) =>
    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)))

  const addPollOption = () => {
    if (pollOptions.length >= 6) return
    setPollOptions((prev) => [...prev, ''])
  }

  const removePollOption = (i) => {
    if (pollOptions.length <= 2) return
    setPollOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      let mediaItems = []
      if (mediaPreviews.length > 0) {
        setUploadProgress(0)
        mediaItems = await uploadMediaFiles(
          mediaPreviews.map((p) => p.file),
          profile?.uid || 'anonymous',
          setUploadProgress,
        )
        setUploadProgress(null)
      }

      if (activeType === 'post') {
        if (!title.trim() || !content.trim()) throw new Error('제목과 내용을 모두 입력해 주세요.')
        await createCommunityPost(
          { board: selectedBoard, title, content, tag: 'NOW', anonymous, mediaItems },
          profile,
        )
      } else if (activeType === 'poll') {
        await createPollPost(
          { board: selectedBoard, question: pollQuestion, options: pollOptions, anonymous },
          profile,
        )
      } else if (activeType === 'question') {
        if (!title.trim()) throw new Error('질문 제목을 입력해 주세요.')
        await createQuestionPost(
          { board: selectedBoard, title, content, anonymous, mediaItems },
          profile,
        )
      } else if (activeType === 'board') {
        await createBoard(
          { name: boardName, description: boardDesc, isPublic: boardPublic, schoolRestricted: boardSchool },
          profile,
        )
      }

      navigate('/home', { replace: true })
    } catch (err) {
      setError(err.message || '게시에 실패했습니다.')
      setUploadProgress(null)
    } finally {
      setSubmitting(false)
    }
  }

  const sharedControls = (
    <div className="grid gap-3 sm:grid-cols-2">
      {activeType !== 'board' && (
        <label className="flex flex-col gap-1.5 text-sm font-black text-ink">
          게시판
          <select
            className="neo-input"
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
          >
            {boards.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
      )}
      {activeType !== 'board' && (
        <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-mono-200 bg-mono-50 px-4 py-3 text-sm font-black text-ink">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          익명으로 작성하기
        </label>
      )}
    </div>
  )

  const mediaSection = (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-black tracking-[0.16em] text-mono-500">미디어 첨부 (선택)</p>

      {mediaPreviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mediaPreviews.map((item, i) => (
            <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl bg-mono-100">
              {item.type === 'image' ? (
                <img src={item.localUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <VideoPlayer src={item.localUrl} className="h-full w-full" />
              )}
              <button
                type="button"
                onClick={() => removeMedia(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <XIcon />
              </button>
              {item.type === 'video' && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] font-black text-white">
                  VIDEO
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-mono-200 bg-mono-50 px-3 py-2 text-xs font-black text-mono-600 transition hover:bg-mono-100"
        >
          <ImgIcon />이미지
        </button>
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-mono-200 bg-mono-50 px-3 py-2 text-xs font-black text-mono-600 transition hover:bg-mono-100"
        >
          <VideoIcon />동영상 (최대 {MAX_VIDEO_SECONDS}초)
        </button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { addMedia(e.target.files, 'image'); e.target.value = '' }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { addMedia(e.target.files, 'video'); e.target.value = '' }}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 animate-[slideUpFade_0.3s_ease-out]">
      <header>
        <h1 className="sys-text text-3xl font-black text-ink">작성</h1>
      </header>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchType(tab.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-black transition ${activeType === tab.id ? 'chip-active' : 'chip-idle'}`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      <FieldError message={error} />

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-black text-mono-500">업로드 중... {uploadProgress}%</p>
          <div className="h-2 overflow-hidden rounded-full bg-mono-200">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${uploadProgress}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
      )}

      {/* ── 글쓰기 ── */}
      {activeType === 'post' && (
        <section className="neo-card flex flex-col gap-4 p-5">
          <h2 className="text-xl font-black text-ink">새 글 올리기</h2>
          {sharedControls}
          <input
            className="neo-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
          />
          <textarea
            className="neo-input min-h-[200px] resize-y"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="지금 공유하고 싶은 이야기를 적어 주세요"
          />
          {mediaSection}
          <div className="flex justify-end">
            <button type="button" className="neo-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '게시 중...' : '게시하기'}
            </button>
          </div>
        </section>
      )}

      {/* ── 투표 ── */}
      {activeType === 'poll' && (
        <section className="neo-card flex flex-col gap-4 p-5">
          <h2 className="text-xl font-black text-ink">투표 만들기</h2>
          {sharedControls}
          <input
            className="neo-input"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="투표 질문을 입력해 주세요 (예: 급식 뭐가 더 맛있음?)"
          />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black tracking-[0.16em] text-mono-500">선택지 (최소 2개, 최대 6개)</p>
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="neo-input flex-1"
                  value={opt}
                  onChange={(e) => setPollOption(i, e.target.value)}
                  placeholder={`선택지 ${i + 1}`}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePollOption(i)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-mono-200 bg-mono-50 text-mono-500 transition hover:bg-mono-100"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button
                type="button"
                onClick={addPollOption}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-mono-300 py-2.5 text-sm font-black text-mono-500 transition hover:bg-mono-50"
              >
                <PlusIcon />선택지 추가
              </button>
            )}
          </div>
          <div className="flex justify-end">
            <button type="button" className="neo-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '게시 중...' : '투표 올리기'}
            </button>
          </div>
        </section>
      )}

      {/* ── Q&A ── */}
      {activeType === 'question' && (
        <section className="neo-card flex flex-col gap-4 p-5">
          <h2 className="text-xl font-black text-ink">질문하기</h2>
          {sharedControls}
          <input
            className="neo-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="질문 제목을 입력해 주세요"
          />
          <textarea
            className="neo-input min-h-[140px] resize-y"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="질문 내용을 자세히 설명해 주세요"
          />
          {mediaSection}
          <div className="flex justify-end">
            <button type="button" className="neo-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '게시 중...' : '질문 올리기'}
            </button>
          </div>
        </section>
      )}

      {/* ── 게시판 생성 ── */}
      {activeType === 'board' && (
        <section className="neo-card flex flex-col gap-4 p-5">
          <h2 className="text-xl font-black text-ink">새 게시판 열기</h2>
          <input
            className="neo-input"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="게시판 이름 (예: 입시, 동아리, 밴드부)"
          />
          <textarea
            className="neo-input resize-none"
            rows={2}
            value={boardDesc}
            onChange={(e) => setBoardDesc(e.target.value)}
            placeholder="게시판 설명 (선택)"
          />
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-mono-200 bg-mono-50 px-4 py-3 text-sm font-black text-ink">
              <input type="checkbox" checked={boardPublic} onChange={(e) => setBoardPublic(e.target.checked)} />
              공개 게시판 (누구나 볼 수 있음)
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-mono-200 bg-mono-50 px-4 py-3 text-sm font-black text-ink">
              <input type="checkbox" checked={boardSchool} onChange={(e) => setBoardSchool(e.target.checked)} />
              우리 학교만 (학교 제한)
            </label>
          </div>
          <div className="flex justify-end">
            <button type="button" className="neo-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '생성 중...' : '게시판 만들기'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
