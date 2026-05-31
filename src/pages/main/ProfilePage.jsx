import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import ProfileHeader from '../../components/profile/ProfileHeader.jsx'
import ProfilePostList from '../../components/profile/ProfilePostList.jsx'
import { getPublicProfileByUid } from '../../services/userProfile.js'
import {
  approveFriendRequest,
  declineFriendRequest,
  getCommunityUserById,
  getPostsForProfileView,
  getRelationshipState,
  getUserFriendStats,
  removeFriend,
  sendFriendRequest,
} from '../../services/community.js'

function ProfilePage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { profile, firebaseUser } = useAuth()
  const [remoteProfile, setRemoteProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [relationshipState, setRelationshipState] = useState({ status: 'none', relationship: null })
  const [friendStats, setFriendStats] = useState({ friends: 0, pendingApprovals: 0, outgoingApprovals: 0 })
  const [visiblePosts, setVisiblePosts] = useState([])
  const [fallbackUser, setFallbackUser] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!userId) return
    if (firebaseUser?.uid === userId) {
      navigate('/my', { replace: true })
      return
    }

    let cancelled = false
    setProfileLoaded(false)
    getPublicProfileByUid(userId)
      .then((data) => {
        if (!cancelled) {
          setRemoteProfile(data)
          setProfileLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setProfileLoaded(true)
      })
    return () => { cancelled = true }
  }, [firebaseUser?.uid, navigate, userId])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    getCommunityUserById(userId).then((data) => {
      if (!cancelled) setFallbackUser(data)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([
      getRelationshipState(firebaseUser?.uid, userId),
      getUserFriendStats(userId),
    ]).then(([rel, stats]) => {
      if (!cancelled) {
        setRelationshipState(rel)
        setFriendStats(stats)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [firebaseUser?.uid, userId, refreshKey])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    getPostsForProfileView(userId, firebaseUser?.uid, profile).then((posts) => {
      if (!cancelled) setVisiblePosts(posts)
    }).catch(() => {
      if (!cancelled) setVisiblePosts([])
    })
    return () => { cancelled = true }
  }, [firebaseUser?.uid, profile, userId, refreshKey])

  const resolvedProfile = {
    ...(fallbackUser || {}),
    ...(remoteProfile || {}),
    school: remoteProfile?.school || fallbackUser?.school,
    schoolName: remoteProfile?.school?.name || fallbackUser?.schoolName,
    region:
      remoteProfile?.school?.address?.split(' ').slice(0, 2).join(' ') ||
      fallbackUser?.region ||
      '',
  }

  const refreshRelationship = () => setRefreshKey((prev) => prev + 1)

  if (!resolvedProfile?.nickname) {
    return (
      <div className="flex justify-center animate-[slideUpFade_0.3s_ease-out]">
        <div className="neo-card w-full max-w-[600px] flex flex-col gap-4 p-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="neo-btn-outline w-fit rounded-full px-4 py-2 text-xs"
          >
            뒤로
          </button>
          <p className="text-sm font-semibold text-mono-500">
            {profileLoaded ? '프로필을 찾을 수 없습니다.' : '프로필을 불러오는 중입니다.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center animate-[slideUpFade_0.3s_ease-out]">
      <div className="neo-card w-full max-w-[600px] flex flex-col gap-5 p-5 sm:p-7">
      <ProfileHeader
        profile={resolvedProfile}
        handle={`@${resolvedProfile.id || resolvedProfile.profileId || userId}`}
        postsCount={visiblePosts.length}
        friendsCount={friendStats.friends}
        showSchoolName={false}
        primaryAction={(
          relationshipState.status === 'incoming_approval' ? (
            <>
              <button
                type="button"
                onClick={() => { approveFriendRequest(firebaseUser?.uid, userId); refreshRelationship() }}
                className="neo-btn w-full rounded-xl px-4 py-2 text-sm"
              >
                허용할게요
              </button>
              <button
                type="button"
                onClick={() => { declineFriendRequest(firebaseUser?.uid, userId); refreshRelationship() }}
                className="neo-btn-outline w-full rounded-xl px-4 py-2 text-sm"
              >
                이번엔 보류
              </button>
            </>
          ) : relationshipState.status === 'friends' || relationshipState.status === 'outgoing_pending' ? (
            <>
              <button type="button" className="neo-btn-outline w-full rounded-xl px-4 py-2 text-sm" disabled>
                친구 연결됨
              </button>
              <button
                type="button"
                onClick={() => { removeFriend(firebaseUser?.uid, userId); refreshRelationship() }}
                className="neo-btn-outline w-full rounded-xl px-4 py-2 text-sm"
              >
                연결 해제
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { sendFriendRequest(firebaseUser?.uid, userId, profile); refreshRelationship() }}
              className="neo-btn-outline w-full rounded-xl px-4 py-2 text-sm"
            >
              친구 요청
            </button>
          )
        )}
        secondaryAction={(
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="neo-btn-outline rounded-full px-4 py-2 text-xs"
          >
            뒤로
          </button>
        )}
      />

      {visiblePosts.length === 0 ? (
        <div className="rounded-2xl border border-mono-200 bg-mono-50 p-6 text-sm font-semibold text-mono-500">
          공개된 게시글이 아직 없습니다.
        </div>
      ) : (
        <ProfilePostList posts={visiblePosts} />
      )}
      </div>
    </div>
  )
}

export default ProfilePage
