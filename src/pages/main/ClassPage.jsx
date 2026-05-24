import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getSchoolDayInfo, getSchoolSummary } from '../../services/schoolData.js'
import { createClassPost, getClassPosts } from '../../services/community.js'
import { formatTime } from '../../utils/index.js'

const NO_SCHOOL_COPY = {
  weekend: {
    title: '오늘은 학교를 가지 않는 날이에요!',
    description: (label) => `${label || '주말'} 이라 급식·시간표 정보가 없어요. 푹 쉬어가요 🌿`,
  },
  holiday: {
    title: '오늘은 학교를 가지 않는 날이에요!',
    description: (label) => `${label ? `${label} 이라` : '공휴일이라'} 급식·시간표 정보가 없어요.`,
  },
  'no-data': {
    title: '오늘은 학교를 가지 않는 날이에요!',
    description: () => '재량휴업·시험 기간·방학 등으로 급식·시간표가 등록되어 있지 않아요.',
  },
  'no-school-profile': {
    title: '학교 정보를 먼저 설정해 주세요',
    description: () => '프로필에서 학교/학년/반을 등록하면 급식과 시간표가 보여요.',
  },
  error: {
    title: '잠시 후 다시 시도해 주세요',
    description: () => '교육청 정보를 불러오지 못했어요. 네트워크 상태를 확인해 주세요.',
  },
}

function ClassPage() {
  const { profile } = useAuth()
  const summary = useMemo(() => getSchoolSummary(profile), [profile])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [classPosts, setClassPosts] = useState(() => getClassPosts(profile))
  const [compose, setCompose] = useState({ open: false, title: '', content: '', anonymous: false })
  const [composeError, setComposeError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const next = await getSchoolDayInfo(profile)
        if (!cancelled) setStatus(next)
      } catch (error) {
        console.error('[ClassPage] getSchoolDayInfo failed:', error)
        if (!cancelled) {
          setStatus({
            schoolDay: false,
            reason: 'error',
            reasonLabel: null,
            errored: true,
            meal: { menu: [], available: false },
            timetable: { rows: [], available: false },
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [profile])

  const handleClassPostSubmit = () => {
    if (!compose.title.trim()) {
      setComposeError('제목을 입력해 주세요.')
      return
    }
    try {
      createClassPost(
        { title: compose.title, content: compose.content, anonymous: compose.anonymous },
        profile,
      )
      setClassPosts(getClassPosts(profile))
      setCompose({ open: false, title: '', content: '', anonymous: false })
      setComposeError('')
    } catch (err) {
      setComposeError(err.message || '게시에 실패했습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-7 animate-[slideInRight_0.3s_ease-out] sm:gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="sys-text text-[26px] font-black leading-tight text-ink sm:text-3xl">우리 반</h1>
        <p className="max-w-xl text-[13px] font-medium leading-[1.7] text-mono-500">{summary.summary}</p>
      </header>

      {/* 학교 정보 카드 */}
      <section className="neo-card flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-ink sm:text-xl">{summary.schoolName}</h2>
            <p className="mt-1 text-[12.5px] font-medium text-mono-500">{summary.region}</p>
          </div>
          <div className="rounded-2xl border border-mono-200/70 bg-mono-50/80 px-3.5 py-2.5 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-mono-400">Homeroom</p>
            <p className="mt-0.5 text-base font-black text-ink">{summary.homeroom}</p>
          </div>
        </div>
      </section>

      {/* 급식 / 시간표 영역 */}
      <SchoolDaySection loading={loading} status={status} />

      {/* 급우 게시판 */}
      <section className="neo-card flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-ink sm:text-xl">급우 게시판</h2>
            <p className="mt-1 text-[12.5px] font-medium text-mono-500">
              {summary.homeroom} 전용 익명·실명 게시판이에요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCompose((prev) => ({ ...prev, open: !prev.open }))
              setComposeError('')
            }}
            className="neo-btn-outline min-h-0 rounded-full px-4 py-1.5 text-[12.5px]"
          >
            {compose.open ? '취소' : '글쓰기'}
          </button>
        </div>

        {compose.open && (
          <div className="flex flex-col gap-3 rounded-[20px] border border-mono-200/70 bg-mono-50/80 p-4 animate-[slideUpFade_0.25s_ease-out]">
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

        <div className="flex flex-col gap-2.5">
          {classPosts.length === 0 ? (
            <div className="rounded-[20px] border border-mono-200/70 bg-mono-50/70 px-4 py-5 text-center">
              <p className="text-[13px] font-medium text-mono-500">아직 급우 게시판에 글이 없어요.</p>
              <p className="mt-1 text-[11.5px] text-mono-400">우리 반 첫 번째 글의 주인공이 되어보세요!</p>
            </div>
          ) : (
            classPosts.map((post, i) => (
              <article
                key={post.id}
                className="flex flex-col gap-2 rounded-[20px] border border-mono-200/60 bg-mono-50/70 px-4 py-3.5 animate-[slideUpFade_0.3s_ease-out]"
                style={{ animationDelay: `${Math.min(i * 30, 150)}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="sys-text text-[13.5px] font-black leading-snug text-ink">{post.title}</h3>
                  {post.isAnonymous && (
                    <span className="shrink-0 rounded-full border border-mono-200/70 bg-white px-2 py-0.5 text-[9.5px] font-black text-mono-500">
                      익명
                    </span>
                  )}
                </div>
                {post.content ? (
                  <p className="line-clamp-2 text-[12px] font-medium leading-[1.65] text-mono-600">
                    {post.content}
                  </p>
                ) : null}
                <p className="flex items-center gap-x-2 text-[10.5px] font-medium text-mono-400">
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

function SchoolDaySection({ loading, status }) {
  if (loading || !status) {
    return (
      <section className="neo-card flex flex-col items-center gap-3 px-6 py-10 text-center">
        <div className="h-8 w-8 rounded-full border-[2.5px] border-mono-200 border-t-[var(--accent,#111)] animate-spin" />
        <p className="text-[13px] font-medium text-mono-500">오늘 학교 정보를 확인하고 있어요…</p>
      </section>
    )
  }

  if (!status.schoolDay) {
    const copy = NO_SCHOOL_COPY[status.reason] || NO_SCHOOL_COPY['no-data']
    const showFootnote = status.reason !== 'no-school-profile' && status.reason !== 'error'
    return (
      <section className="neo-card flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="text-[36px]" aria-hidden="true">
          {status.reason === 'error' ? '⚠️' : status.reason === 'no-school-profile' ? '🏫' : '🌿'}
        </div>
        <h2 className="text-[17px] font-black leading-snug text-ink">{copy.title}</h2>
        <p className="max-w-xs text-[13px] leading-[1.7] text-mono-500">
          {copy.description(status.reasonLabel)}
        </p>
        {showFootnote && (
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-mono-400">
            학교별 일정은 다를 수 있으니 공지도 함께 확인해 주세요.
          </p>
        )}
      </section>
    )
  }

  return (
    <>
      {/* 급식표 */}
      <section className="neo-card flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-ink sm:text-xl">급식표</h2>
            <p className="mt-1 text-[12.5px] font-medium text-mono-500">오늘 점심 식단이에요.</p>
          </div>
          <span className="rounded-full border border-mono-200/70 bg-mono-50/80 px-2.5 py-0.5 text-[10.5px] font-black text-mono-500">
            교육청 연동
          </span>
        </div>
        {status.meal.available ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {status.meal.menu.map((item) => (
              <div
                key={item}
                className="rounded-[18px] border border-mono-200/70 bg-white px-4 py-3 text-[13.5px] font-semibold text-ink"
              >
                {item}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-mono-200/70 bg-mono-50/70 px-4 py-5 text-center">
            <p className="text-[13px] font-medium text-mono-500">오늘 급식 정보가 아직 등록되지 않았어요.</p>
            <p className="mt-1 text-[11.5px] text-mono-400">학교에서 식단을 올리면 자동으로 보여드려요.</p>
          </div>
        )}
      </section>

      {/* 시간표 */}
      <section className="neo-card flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
        <div>
          <h2 className="text-lg font-black text-ink sm:text-xl">시간표</h2>
          <p className="mt-1 text-[12.5px] font-medium text-mono-500">오늘 우리 반 시간표예요.</p>
        </div>
        {status.timetable.available ? (
          <div className="flex flex-col gap-2.5">
            {status.timetable.rows.map((slot, index) => (
              <div
                key={`${slot.period}-${index}`}
                className="flex flex-wrap items-center gap-3 rounded-[18px] border border-mono-200/70 bg-mono-50/70 px-4 py-3"
              >
                <span className="rounded-full border border-mono-200/70 bg-white px-2.5 py-0.5 text-[10.5px] font-black text-mono-500">
                  {slot.period}
                </span>
                <div className="min-w-[120px] flex-1">
                  <p className="text-[15px] font-black text-ink">{slot.subject}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-mono-200/70 bg-mono-50/70 px-4 py-5 text-center">
            <p className="text-[13px] font-medium text-mono-500">오늘 시간표가 아직 등록되지 않았어요.</p>
            <p className="mt-1 text-[11.5px] text-mono-400">학교에서 시간표를 올리면 자동으로 보여드려요.</p>
          </div>
        )}
      </section>
    </>
  )
}

export default ClassPage
