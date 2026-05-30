import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppSettings } from '../../context/AppSettingsContext.jsx'
import PostCard from '../../components/PostCard.jsx'
import NativeAdCard from '../../components/NativeAdCard.jsx'
import { getCommunityFlows, getSchoolPosts, toggleCommunityPostVibe } from '../../services/community.js'
import { buildRecommendedFeed, collectInterestTerms } from '../../services/feed.js'
import { injectAdsIntoFeed } from '../../services/ads.js'
import { getTimestampMillis } from '../../utils/index.js'
import { FlameIcon } from '../../components/icons/TabIcons.jsx'

function HomePage() {
  const { profile, firebaseUser } = useAuth()
  const { settings } = useAppSettings()
  const postStyle = settings?.postStyle || 'card'
  const [posts, setPosts] = useState([])
  const [schoolPosts, setSchoolPosts] = useState([])
  const [activeTab, setActiveTab] = useState('추천')
  const [transitionKey, setTransitionKey] = useState(0)
  const viewerUid = firebaseUser?.uid

  // profileRef lets stable callbacks always read the latest profile
  // without needing it as a dependency (avoids re-creating handlers on every profile update)
  const profileRef = useRef(profile)
  useEffect(() => { profileRef.current = profile }, [profile])

  const interests = useMemo(() => collectInterestTerms(profile), [profile?.uid])

  const subscribedBoards = useMemo(() => {
    const boards = profile?.selectedBoards?.filter(Boolean) || []
    return boards.length ? Array.from(new Set(boards)) : ['자유', '질문', '공부', '급식']
  }, [profile?.selectedBoards?.join(',')])  // stable string dep

  const flowTabs = useMemo(() => {
    const base = ['추천', '인기', 'NOW']
    const school = profile?.school ? ['학우 게시판'] : []
    return [...base, ...school, ...subscribedBoards]
  }, [subscribedBoards, profile?.school?.id])  // school.id not the object

  // Load posts only when uid / school / boards actually change
  const boardsKey = profile?.selectedBoards?.join(',') ?? ''

  const loadPosts = useCallback(async () => {
    const [p, s] = await Promise.all([
      getCommunityFlows(profileRef.current),
      getSchoolPosts(profileRef.current),
    ])
    setPosts(p)
    setSchoolPosts(s)
  }, [])

  useEffect(() => {
    loadPosts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, profile?.school?.id, boardsKey])

  // Refresh when the tab / app becomes visible again (picks up admin deletions)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadPosts()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [loadPosts])

  // Reset active tab only if it's no longer in the tab list
  useEffect(() => {
    if (!flowTabs.includes(activeTab)) setActiveTab(flowTabs[0])
  }, [activeTab, flowTabs])

  const visiblePosts = useMemo(() => {
    const byRecent = [...posts].sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))

    if (activeTab === '추천') return buildRecommendedFeed(posts, { uid: viewerUid, interests, hideSeen: true })
    if (activeTab === '인기') return [...posts].sort((a, b) => (b.vibes || 0) - (a.vibes || 0))
    if (activeTab === 'NOW') return byRecent.filter((p) => getTimestampMillis(p.createdAt) >= Date.now() - 36 * 60 * 60 * 1000)
    if (activeTab === '학우 게시판') return [...schoolPosts].sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
    return byRecent.filter((p) => p.board === activeTab)
  }, [activeTab, posts, schoolPosts, viewerUid, interests])

  const feedItems = useMemo(() => injectAdsIntoFeed(visiblePosts), [visiblePosts])

  // Stable callback — never recreated. Uses profileRef for latest profile.
  const handleToggleVibe = useCallback(async (postId) => {
    await toggleCommunityPostVibe(postId, profileRef.current)
    const [p, s] = await Promise.all([
      getCommunityFlows(profileRef.current),
      getSchoolPosts(profileRef.current),
    ])
    setPosts(p)
    setSchoolPosts(s)
  }, [])

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    setTransitionKey((prev) => prev + 1)
  }, [])

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
              {tab === '추천' || tab === '인기'
                ? <><FlameIcon className="w-3.5 h-3.5" />{tab}</>
                : tab}
            </button>
          ))}
        </div>
      </section>

      <section key={transitionKey} className="flex flex-col gap-5 sm:gap-6">
        {visiblePosts.length === 0 ? (
          <div className="neo-card px-6 py-7">
            <h3 className="text-base font-black text-ink">아직 이 탭에 글이 없어요</h3>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-mono-500">
              다른 게시판을 보거나 새 글을 기다려 주세요.
            </p>
          </div>
        ) : (
          feedItems.map((item) =>
            item.type === 'ad' ? (
              <NativeAdCard key={item.id} />
            ) : (
              <PostCard
                key={item.post.id}
                post={item.post}
                onToggleVibe={handleToggleVibe}
                postStyle={postStyle}
              />
            ),
          )
        )}
      </section>
    </div>
  )
}

export default HomePage
