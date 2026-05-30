import { useEffect, useMemo, useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { POPULAR_SEARCH_TERMS } from '../../constants/appSettings.js'
import { searchCommunity } from '../../services/community.js'
import { searchUsersInFirestore } from '../../services/userProfile.js'
import { formatTime } from '../../utils/index.js'

const RESULT_LIMIT = 5
const CATEGORY_CONFIG = [
  { key: 'users', label: '닉네임/아이디' },
  { key: 'posts', label: '게시글' },
]

function SearchPage() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [expandedCategory, setExpandedCategory] = useState(searchParams.get('category') || null)
  const [inputFocused, setInputFocused] = useState(false)
  const [firestoreUsers, setFirestoreUsers] = useState([])

  useEffect(() => {
    const nextQ = searchParams.get('q') || ''
    const nextCategory = searchParams.get('category') || null
    setQ(nextQ)
    setExpandedCategory(nextCategory)
  }, [searchParams])

  const keyword = q.trim()

  useEffect(() => {
    const term = keyword.startsWith('@') ? keyword.slice(1) : keyword
    if (!term) {
      setFirestoreUsers([])
      return
    }
    let cancelled = false
    searchUsersInFirestore(term)
      .then((results) => { if (!cancelled) setFirestoreUsers(results) })
      .catch(() => { if (!cancelled) setFirestoreUsers([]) })
    return () => { cancelled = true }
  }, [keyword])

  const [communityResult, setCommunityResult] = useState({ posts: [], users: [] })

  useEffect(() => {
    if (!keyword) {
      setCommunityResult({ posts: [], users: [] })
      return
    }
    let cancelled = false
    searchCommunity(keyword, profile)
      .then((result) => { if (!cancelled) setCommunityResult(result) })
      .catch(() => { if (!cancelled) setCommunityResult({ posts: [], users: [] }) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, profile?.uid])

  const { posts, users: communityUsers } = communityResult

  const users = useMemo(() => {
    const map = new Map()
    communityUsers.forEach((u) => map.set(u.id, u))
    firestoreUsers.forEach((u) => {
      if (!map.has(u.uid)) {
        map.set(u.uid, {
          id: u.uid,
          nickname: u.nickname || '',
          intro: u.intro || '',
          region: '',
          schoolName: u.school?.name || '',
          boards: u.selectedBoards || [],
          profileId: u.id || '',
          profilePhoto: u.profilePhoto || null,
        })
      } else {
        const existing = map.get(u.uid)
        if (!existing.profilePhoto && u.profilePhoto) {
          map.set(u.uid, { ...existing, profilePhoto: u.profilePhoto })
        }
      }
    })
    return Array.from(map.values())
  }, [communityUsers, firestoreUsers])

  const resultsByCategory = useMemo(() => ({ posts, users }), [posts, users])

  const visibleResults = useMemo(() => {
    if (!keyword) return resultsByCategory
    if (!expandedCategory) {
      return {
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

  const handlePopularTermClick = (term) => syncParams(term, null)

  const renderPostCards = (items) => (
    <div className="flex flex-col gap-2">
      {items.map((post) => (
        <NavLink key={post.id} to={`/post/${post.id}`} className="neo-card block p-4 transition hover:bg-mono-50">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mono-500">{post.board}</p>
              <h3 className="mt-1 truncate text-base font-black text-ink">{post.title}</h3>
            </div>
            <span className="shrink-0 text-xs font-semibold text-mono-500">{formatTime(post.createdAt)}</span>
          </div>
        </NavLink>
      ))}
    </div>
  )

  const renderUserCards = (items) => (
    <div className="flex flex-col gap-3">
      {items.map((user) => (
        <NavLink key={user.id} to={`/users/${user.id}`} className="neo-card p-4 transition hover:bg-mono-50">
          <div className="flex items-center gap-3">
            {user.profilePhoto?.url ? (
              <div className="h-11 w-11 overflow-hidden rounded-full border border-mono-200 bg-mono-100">
                <img src={user.profilePhoto.url} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-mono-200 bg-mono-100 text-sm font-black text-ink">
                {user.nickname?.[0] || 'U'}
              </div>
            )}
            <div>
              <h3 className="text-base font-black text-ink">{user.nickname}</h3>
              {user.intro && <p className="mt-1 text-sm font-semibold text-mono-500">{user.intro}</p>}
            </div>
          </div>
          {((user.boards || []).length > 0 || user.region) && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-mono-500">
              {(user.boards || []).slice(0, 4).map((board) => (
                <span key={board} className="rounded-full border border-mono-200 bg-white px-2.5 py-1">
                  {board}
                </span>
              ))}
              {user.region && <span className="rounded-full border border-mono-200 bg-white px-2.5 py-1">{user.region}</span>}
            </div>
          )}
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

        {items.length === 0 ? (
          <div className="neo-card p-5 text-sm font-semibold text-mono-500">
            {keyword ? `${category.label} 결과가 없습니다.` : '검색 전에는 인기 검색어를 눌러볼 수 있어요.'}
          </div>
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
        <input
          className="neo-input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            syncParams(e.target.value, null)
          }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="닉네임, 아이디(@제외), 게시글을 검색해 보세요"
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
    </div>
  )
}

export default SearchPage
