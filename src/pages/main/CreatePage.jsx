import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import FieldError from '../../components/FieldError.jsx'
import { createCommunityBoard, createCommunityPost, getCommunityBoards } from '../../services/community.js'

function CreatePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const boards = useMemo(() => getCommunityBoards(profile), [profile])
  const [mode, setMode] = useState('post')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedBoard, setSelectedBoard] = useState(boards[0] || '자유')
  const [anonymous, setAnonymous] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handlePostSubmit = () => {
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해 주세요.')
      setSuccess('')
      return
    }

    createCommunityPost(
      {
        board: selectedBoard,
        title,
        content,
        tag: 'NOW',
        anonymous,
      },
      profile,
    )

    setError('')
    setSuccess('새 글이 실시간 스냅과 검색 결과에 바로 반영됐어요.')
    setTitle('')
    setContent('')
    navigate('/home', { replace: true })
  }

  const handleBoardSubmit = () => {
    try {
      const created = createCommunityBoard(newBoardName)
      setError('')
      setSuccess(`${created} 게시판이 추가됐어요. 이제 글 작성에서 바로 선택할 수 있어요.`)
      setNewBoardName('')
    } catch (err) {
      setSuccess('')
      setError(err.message || '게시판을 만들지 못했습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-[slideUpFade_0.3s_ease-out]">
      <header>
        <h1 className="sys-text text-3xl font-black text-ink">작성</h1>
        <p className="mt-2 text-sm font-semibold text-mono-500">게시판에 새 글을 올리거나, 새 게시판을 열어 커뮤니티 흐름을 직접 만들 수 있어요.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'post', label: '게시물 작성' },
          { id: 'board', label: '게시판 만들기' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setMode(item.id)
              setError('')
              setSuccess('')
            }}
            className={`rounded-full border px-4 py-2 text-sm font-black transition ${mode === item.id ? 'chip-active' : 'chip-idle'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <FieldError message={error} />
      {success && <p className="rounded-2xl border border-mono-200 bg-mono-50 px-4 py-3 text-sm font-semibold text-ink">{success}</p>}

      {mode === 'post' ? (
        <section className="neo-card flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-xl font-black text-ink">지금 흐름에 올릴 새 글</h2>
            <p className="mt-1 text-sm font-semibold text-mono-500">작성한 글은 실시간 스냅과 검색 결과에 바로 연결됩니다.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-black text-ink">
              게시판
              <select
                className="neo-input"
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
              >
                {boards.map((board) => (
                  <option key={board} value={board}>{board}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-[22px] border border-mono-200 bg-mono-50 px-4 py-3 text-sm font-black text-ink">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              익명으로 작성하기
            </label>
          </div>

          <input
            className="neo-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
          />
          <textarea
            className="neo-input min-h-[220px] resize-y"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="지금 공유하고 싶은 이야기를 적어 주세요"
          />

          <div className="flex justify-end">
            <button type="button" className="neo-btn" onClick={handlePostSubmit}>
              게시하기
            </button>
          </div>
        </section>
      ) : (
        <section className="neo-card flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-xl font-black text-ink">새 게시판 열기</h2>
            <p className="mt-1 text-sm font-semibold text-mono-500">새 주제의 흐름을 열면 작성 화면과 검색에 바로 반영돼요.</p>
          </div>
          <input
            className="neo-input"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="예: 입시, 프로젝트, 밴드부"
          />
          <div className="flex justify-end">
            <button type="button" className="neo-btn" onClick={handleBoardSubmit}>
              게시판 만들기
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default CreatePage
