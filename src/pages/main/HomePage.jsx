import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import PostCard from '../../components/PostCard.jsx'
import { getCommunityFlows, getSchoolPosts, toggleCommunityPostVibe } from '../../services/community.js'
import { getTimestampMillis } from '../../utils/index.js'
import { FlameIcon } from '../../components/icons/TabIcons.jsx'

function HomePage() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState(() => getCommunityFlows(profile))
  const [schoolPosts, setSchoolPosts] = useState(() => getSchoolPosts(profile))
  const [activeTab, setActiveTab] = useState('인기')
  const [transitionKey, setTransitionKey] = useState(0)

  const subscribedBoards = useMemo(() => {
    const boards = profile?.selectedBoards?.filter(Boolean) || []
    return boards.length ? Array.from(new Set(boards)) : ['자유', '질문', '공부', '급식']
  }, [profile?.selectedBoards])

  const flowTabs = useMemo(() => {
    const base = ['인기', 'NOW']
    const school = profile?.school ? ['학우 게시판'] : []
    return [...base, ...school, ...subscribedBoards]
  }, [subscribedBoards, profile?.school])

  useEffect(() => {
    setPosts(getCommunityFlows(profile))
    setSchoolPosts(getSchoolPosts(profile))
  }, [profile])

  useEffect(() => {
    if (!flowTabs.includes(activeTab)) {
      setActiveTab(flowTabs[0])
    }
  }, [activeTab, flowTabs])

  const visiblePosts = useMemo(() => {
    const byVibes = [...posts].sort((a, b) => (b.vibes || 0) - (a.vibes || 0))
    const byRecent = [...posts].sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))

    if (activeTab === '인기') return byVibes
    if (activeTab === 'NOW') return byRecent.filter((post) => getTimestampMillis(post.createdAt) >= Date.now() - 36 * 60 * 60 * 1000)
    if (activeTab === '학우 게시판') return [...schoolPosts].sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))

    return byRecent.filter((post) => post.board === activeTab)
  }, [activeTab, posts, schoolPosts])

  const handleToggleVibe = (postId) => {
    toggleCommunityPostVibe(postId, profile)
    setPosts(getCommunityFlows(profile))
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setTransitionKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col gap-7 animate-[slideUpFade_0.3s_ease-out] sm:gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-mono-400">실시간 스냅</p>
        <h1 className="sys-text text-[26px] font-black leading-tight text-ink sm:text-3xl">실시간 스냅</h1>
        <p className="max-w-xl text-[13px] font-medium leading-[1.7] text-mono-500">
          지금 반응 좋은 흐름을 구독한 게시판 중심으로 이어서 보여줄게요.
        </p>
      </section>

      <section className="-mx-4 overflow-x-auto px-4 hide-scrollbar sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1.5">
          {flowTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-black transition ${
                activeTab === tab ? 'chip-active' : 'chip-idle'
              }`}
            >
              {tab === '인기' ? <><FlameIcon className="w-3.5 h-3.5" />인기</> : tab}
            </button>
          ))}
        </div>
      </section>

      <section key={transitionKey} className="flex flex-col gap-5 animate-[slideUpFade_0.3s_ease-out] sm:gap-6">
        {visiblePosts.length === 0 ? (
          <div className="neo-card px-6 py-7">
            <h3 className="text-base font-black text-ink">아직 이 탭에 글이 없어요</h3>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-mono-500">
              다른 게시판을 보거나 새 글을 기다려 주세요.
            </p>
          </div>
        ) : (
          visiblePosts.map((post) => <PostCard key={post.id} post={post} onToggleVibe={handleToggleVibe} />)
        )}
      </section>
    </div>
  )
}

export default HomePage
