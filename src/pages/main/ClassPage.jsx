import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getMealForSchool, getTimetableForSchool, getSchoolSummary } from '../../services/schoolData.js'
import { createClassPost, getClassPosts } from '../../services/community.js'
import { formatTime } from '../../utils/index.js'

function ClassPage() {
  const { profile } = useAuth()
  const summary = useMemo(() => getSchoolSummary(profile), [profile])
  const [meal, setMeal] = useState({ date: '', schoolName: '', menu: [], source: 'no-data' })
  const [timetable, setTimetable] = useState([])
  const [classPosts, setClassPosts] = useState(() => getClassPosts(profile))
  const [compose, setCompose] = useState({ open: false, title: '', content: '', anonymous: false })
  const [composeError, setComposeError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const [nextMeal, nextTimetable] = await Promise.all([
        getMealForSchool(profile),
        getTimetableForSchool(profile),
      ])
      if (!cancelled) {
        setMeal(nextMeal)
        setTimetable(nextTimetable)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [profile])

  const handleClassPostSubmit = () => {
    if (!compose.title.trim()) {
      setComposeError('제목을 입력해 주세요.')
      return
    }
    try {
      createClassPost({ title: compose.title, content: compose.content, anonymous: compose.anonymous }, profile)
      setClassPosts(getClassPosts(profile))
      setCompose({ open: false, title: '', content: '', anonymous: false })
      setComposeError('')
    } catch (err) {
      setComposeError(err.message || '게시에 실패했습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-[slideInRight_0.3s_ease-out]">
      <header className="flex flex-col gap-2">
        <h1 className="sys-text text-3xl font-black text-ink">우리 반</h1>
        <p className="max-w-xl text-sm font-semibold leading-6 text-mono-500">{summary.summary}</p>
      </header>

      {/* 학교 정보 */}
      <section className="neo-card flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">{summary.schoolName}</h2>
            <p className="mt-1 text-sm font-semibold text-mono-500">{summary.region}</p>
          </div>
          <div className="rounded-2xl border border-mono-200 bg-mono-50 px-4 py-3 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-mono-500">Homeroom</p>
            <p className="mt-1 text-lg font-black text-ink">{summary.homeroom}</p>
          </div>
        </div>
      </section>

      {/* 급식표 */}
      <section className="neo-card flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">급식표</h2>
            <p className="mt-1 text-sm font-semibold text-mono-500">{meal.date} 기준 메뉴예요.</p>
          </div>
          <span className="rounded-full border border-mono-200 bg-mono-50 px-3 py-1 text-xs font-black text-mono-500">
            {meal.source === 'neis' ? '교육청 연동' : '정보 없음'}
          </span>
        </div>
        {meal.source === 'no-data' || meal.menu.length === 0 ? (
          <div className="rounded-[22px] border border-mono-200 bg-mono-50 p-4 text-center">
            <p className="text-sm font-semibold text-mono-500">오늘 급식 정보를 불러올 수 없어요.</p>
            <p className="mt-1 text-xs text-mono-400">교육청 API가 연동되면 자동으로 표시됩니다.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {meal.menu.map((item) => (
              <div key={item} className="rounded-[20px] border border-mono-200 bg-white px-4 py-3 text-sm font-semibold text-ink">
                {item}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 시간표 */}
      <section className="neo-card flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-xl font-black text-ink">시간표</h2>
          <p className="mt-1 text-sm font-semibold text-mono-500">{summary.homeroom} 기준으로 보여줘요.</p>
        </div>
        <div className="flex flex-col gap-3">
          {timetable.map((slot) => (
            <div key={slot.period} className="flex flex-wrap items-center gap-3 rounded-[22px] border border-mono-200 bg-mono-50 px-4 py-3">
              <span className="rounded-full border border-mono-200 bg-white px-3 py-1 text-xs font-black text-mono-500">
                {slot.period}
              </span>
              <div className="min-w-[120px] flex-1">
                <p className="text-base font-black text-ink">{slot.subject}</p>
                <p className="mt-1 text-xs font-semibold text-mono-500">{slot.room}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 급우 게시판 */}
      <section className="neo-card flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">급우 게시판</h2>
            <p className="mt-1 text-sm font-semibold text-mono-500">
              {summary.homeroom} 전용 익명·실명 게시판이에요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setCompose((prev) => ({ ...prev, open: !prev.open })); setComposeError('') }}
            className="neo-btn-outline rounded-full px-4 py-2 text-sm"
          >
            {compose.open ? '취소' : '글쓰기'}
          </button>
        </div>

        {compose.open && (
          <div className="flex flex-col gap-3 rounded-[24px] border border-mono-200 bg-mono-50 p-4 animate-[slideUpFade_0.25s_ease-out]">
            <input
              type="text"
              placeholder="제목을 입력하세요"
              className="neo-input"
              value={compose.title}
              onChange={(e) => setCompose((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              placeholder="내용을 입력하세요 (선택)"
              className="neo-input resize-none"
              rows={3}
              value={compose.content}
              onChange={(e) => setCompose((prev) => ({ ...prev, content: e.target.value }))}
            />
            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={compose.anonymous}
                  onChange={(e) => setCompose((prev) => ({ ...prev, anonymous: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                익명으로 작성
              </label>
              <button
                type="button"
                onClick={handleClassPostSubmit}
                disabled={!compose.title.trim()}
                className="neo-btn min-h-0 rounded-xl px-4 py-2 text-sm"
              >
                게시하기
              </button>
            </div>
            {composeError && (
              <p className="text-xs font-semibold text-error-text">{composeError}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {classPosts.length === 0 ? (
            <div className="rounded-[22px] border border-mono-200 bg-mono-50 p-4 text-center">
              <p className="text-sm font-semibold text-mono-500">아직 급우 게시판에 글이 없어요.</p>
              <p className="mt-1 text-xs text-mono-400">우리 반 첫 번째 글의 주인공이 되어보세요!</p>
            </div>
          ) : (
            classPosts.map((post, i) => (
              <article
                key={post.id}
                className="flex flex-col gap-1.5 rounded-[22px] border border-mono-200 bg-mono-50 px-4 py-3 animate-[slideUpFade_0.3s_ease-out]"
                style={{ animationDelay: `${Math.min(i * 30, 150)}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="sys-text text-sm font-black text-ink">{post.title}</h3>
                  {post.isAnonymous && (
                    <span className="shrink-0 rounded-full border border-mono-200 bg-white px-2 py-0.5 text-[10px] font-black text-mono-500">
                      익명
                    </span>
                  )}
                </div>
                {post.content ? (
                  <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-mono-600">
                    {post.content}
                  </p>
                ) : null}
                <p className="flex items-center gap-x-2 text-[11px] font-semibold text-mono-400">
                  <span>{post.isAnonymous ? '익명' : post.author}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatTime(post.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>공감 {post.vibes ?? 0}</span>
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default ClassPage
