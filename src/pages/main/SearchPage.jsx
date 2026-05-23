import { useEffect, useMemo, useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { POPULAR_SEARCH_TERMS } from '../../constants/appSettings.js'
import { searchSchools } from '../../services/neis.js'
import { searchCommunity } from '../../services/community.js'
import { formatTime, getRegionFromAddress } from '../../utils/index.js'

const RESULT_LIMIT = 5
const CATEGORY_CONFIG = [
  { key: 'users', label: '닉네임/아이디' },
  { key: 'posts', label: '게시글' },
  { key: 'schools', label: '게시판 · 학교' },
]

function SearchPage() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [expandedCategory, setExpandedCategory] = useState(searchParams.get('category') || null)
  const [schoolResults, setSchoolResults] = useState([])
  const [schoolLoading, setSchoolLoading] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  useEffect(() => {
    const nextQ = searchParams.get('q') || ''
    const nextCategory = searchParams.get('category') || null
    setQ(nextQ)
    setExpandedCategory(nextCategory)
  }, [searchParams])

  useEffect(() => {
    const keyword = q.trim()
    if (!keyword) {
      setSchoolResults([])
      setExpandedCategory(null)
      return
    }

    let cancelled = false
    setSchoolLoading(true)

    searchSchools(keyword)
      .then((results) => {
        if (!cancelled) setSchoolResults(results)
      })
      .catch(() => {
        if (!cancelled) setSchoolResults([])
      })
      .finally(() => {
        if (!cancelled) setSchoolLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [q])

  const keyword = q.trim()
  const { posts, users } = useMemo(() => searchCommunity(keyword, profile), [keyword, profile])

  const normalizedSchoolResults = useMemo(
    () =>
      schoolResults.map((school) => ({
        ...school,
        region: getRegionFromAddress(school.address),
      })),
    [schoolResults],
  )

  const resultsByCategory = useMemo(
    () => ({
      schools: normalizedSchoolResults,
      posts,
      users,
    }),
    [normalizedSchoolResults, posts, users],
  )

  const visibleResults = useMemo(() => {
    if (!keyword) return resultsByCategory
    if (!expandedCategory) {
      return {
        schools: resultsByCategory.schools.slice(0, RESULT_LIMIT),
        posts: resultsByCategory.posts.slice(0, RESULT_LIMIT),
        users: resultsByCategory.users.slice(0, RESULT_LIMIT),
      }
    }

    return {
      ...resultsByCategory,
      [expandedCategory]: resultsByCategory[expandedCategory],
    }
  }, [expandedCategory, keyword, resultsByCategory])

  const totalResultCount = Object.values(resultsByCategory).reduce((sum, list) => sum + list.length, 0)

  const syncParams = (nextKeyword, nextCategory = null) => {
    const params = {}
    if (nextKeyword.trim()) params.q = nextKeyword.trim()
    if (nextCategory) params.category = nextCategory
    setSearchParams(params)
  }

  const handlePopularTermClick = (term) => {
    syncParams(term, null)
  }

  const renderSchoolCards = (items) => (
    <div className="flex flex-col gap-3">
      {items.map((school) => (
        <article key={school.id} className="neo-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-ink">{school.name}</h3>
              <p className="mt-2 text-sm font-semibold text-mono-500">{school.address}</p>
            </div>
            <div className="rounded-full border border-mono-200 bg-mono-50 px-3 py-1 text-xs font-black text-mono-500">
              {school.type}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-mono-500">
            <span className="rounded-full border border-mono-200 bg-white px-2.5 py-1">{school.region || '지역 정보 없음'}</span>
            <span className="rounded-full border border-mono-200 bg-white px-2.5 py-1">교육청 코드 {school.eduCode}</span>
          </div>
        </article>
      ))}
    </div>
  )

  const renderPostCards = (items) => (
    <div className="flex flex-col gap-3">
      {items.map((post) => (
        <article key={post.id} className="neo-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mono-500">{post.board}</p>
              <h3 className="mt-2 text-lg font-black text-ink">{post.title}</h3>
            </div>
            <span className="text-xs font-semibold text-mono-500">{formatTime(post.createdAt)}</span>
          </div>
          <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-mono-600">{post.content}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-mono-500">
            {post.isAnonymous ? (
              <span className="rounded-full border border-mono-200 bg-mono-50 px-2.5 py-1">글쓴이 익명</span>
            ) : (
              <NavLink to={`/users/${post.ownerUid || post.authorId}`} className="rounded-full border border-mono-200 bg-mono-50 px-2.5 py-1 transition hover:bg-mono-100">
                작성자 {post.author}
              </NavLink>
            )}
            <span className="rounded-full border border-mono-200 bg-mono-50 px-2.5 py-1">공감 {post.vibes ?? post.likes}</span>
            <span className="rounded-full border border-mono-200 bg-mono-50 px-2.5 py-1">{post.schoolName}</span>
          </div>
        </article>
      ))}
    </div>
  )

  const renderUserCards = (items) => (
    <div className="flex flex-col gap-3">
      {items.map((user) => (
        <NavLink key={user.id} to={`/users/${user.id}`} className="neo-card p-4 transition hover:bg-mono-50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-mono-200 bg-mono-100 text-sm font-black text-ink">
              {user.nickname?.[0] || 'U'}
            </div>
            <div>
              <h3 className="text-base font-black text-ink">{user.nickname}</h3>
              <p className="mt-1 text-sm font-semibold text-mono-500">{user.intro}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-mono-500">
            {(user.boards || []).slice(0, 4).map((board) => (
              <span key={board} className="rounded-full border border-mono-200 bg-white px-2.5 py-1">
                {board}
              </span>
            ))}
            {user.region && <span className="rounded-full border border-mono-200 bg-white px-2.5 py-1">{user.region}</span>}
          </div>
        </NavLink>
      ))}
    </div>
  )

  const renderCategory = (category) => {
    const items = visibleResults[category.key] || []
    const total = resultsByCategory[category.key]?.length || 0
    const canExpand = keyword && !expandedCategory && total > RESULT_LIMIT
    const isExpanded = expandedCategory === category.key

    return (
      <section key={category.key} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">{category.label}</h2>
            <p className="mt-1 text-sm font-semibold text-mono-500">
              {keyword ? `${total}개의 결과` : '검색어를 입력하면 결과가 나타나요'}
            </p>
          </div>
          {canExpand && (
            <button
              type="button"
              onClick={() => syncParams(keyword, category.key)}
              className="neo-btn-outline rounded-full px-4 py-2 text-xs"
            >
              더보기
            </button>
          )}
          {isExpanded && (
            <button
              type="button"
              onClick={() => syncParams(keyword, null)}
              className="neo-btn-outline rounded-full px-4 py-2 text-xs"
            >
              접기
            </button>
          )}
        </div>

        {category.key === 'schools' && schoolLoading ? (
          <div className="neo-card p-5 text-sm font-semibold text-mono-500">학교 정보를 불러오는 중입니다.</div>
        ) : items.length === 0 ? (
          <div className="neo-card p-5 text-sm font-semibold text-mono-500">
            {keyword ? `${category.label} 결과가 없습니다.` : '검색 전에는 인기 검색어를 눌러볼 수 있어요.'}
          </div>
        ) : category.key === 'schools' ? (
          renderSchoolCards(items)
        ) : category.key === 'posts' ? (
          renderPostCards(items)
        ) : (
          renderUserCards(items)
        )}
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-[slideInRight_0.3s_ease-out]">
      <header className="flex flex-col gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mono-500">search</p>
          <h1 className="sys-text mt-2 text-3xl font-black text-ink">실시간 검색</h1>
          <p className="mt-2 text-sm font-semibold text-mono-500">
            학교 정보, 게시글, 친구 흐름을 한 번에 탐색하고 원하는 카테고리만 더 깊게 열람할 수 있어요.
          </p>
        </div>

        <input
          className="neo-input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            syncParams(e.target.value, null)
          }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="닉네임, 게시글, 학교를 검색해 보세요"
        />
      </header>

      {inputFocused && !keyword && (
        <section className="neo-card flex flex-col gap-4 p-5 animate-[slideUpFade_0.2s_ease-out]">
          <h2 className="text-lg font-black text-ink">인기 검색어</h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCH_TERMS.map((term) => (
              <button
                key={term}
                type="button"
                onMouseDown={() => handlePopularTermClick(term)}
                className="rounded-full border px-4 py-2 text-sm font-black transition chip-idle"
              >
                {term}
              </button>
            ))}
          </div>
        </section>
      )}

      {keyword && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-mono-500">전체 {totalResultCount}개의 결과</span>
          </div>
          {CATEGORY_CONFIG.map(renderCategory)}
        </div>
      )}

      {!keyword && !inputFocused && (
        <section className="neo-card p-6">
          <h2 className="text-xl font-black text-ink">검색어를 입력하면 결과가 바로 필터링돼요</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-mono-500">
            닉네임, 게시글, 학교 이름 등을 입력해 보세요.
          </p>
        </section>
      )}
    </div>
  )
}

export default SearchPage
