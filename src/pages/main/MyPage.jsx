import { useEffect, useMemo, useRef, useState } from 'react'
import { BellIcon, MenuIcon, ListIcon } from '../../components/icons/TabIcons.jsx'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import ProfileHeader from '../../components/profile/ProfileHeader.jsx'
import ProfilePostList from '../../components/profile/ProfilePostList.jsx'
import {
  approveFriendRequest,
  declineFriendRequest,
  getFriendApprovalNotifications,
  getPostsByOwner,
  getUserFriendStats,
} from '../../services/community.js'
import { getRecentAnnouncements } from '../../services/announcements.js'

const DISMISSED_KEY = 'ocl:dismissed-announcements'
function getDismissedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')) } catch { return new Set() }
}

const ANNC_LABEL = { alert: '긴급', event: '이벤트', update: '업데이트', notice: '공지' }
const ANNC_COLOR = {
  alert: 'text-red-600 bg-red-50',
  event: 'text-purple-600 bg-purple-50',
  update: 'text-blue-500 bg-blue-50',
  notice: 'text-amber-600 bg-amber-50',
}

// menuRef, menuOpen are kept for potential future use but dropdown is removed

function MyPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { profile, firebaseUser, updateProfilePhoto, clearProfilePhoto, updateProfile } = useAuth()
  const [version, setVersion] = useState(0)
  const [tab, setTab] = useState('posts')
  const [bioEditing, setBioEditing] = useState(false)
  const [bioText, setBioText] = useState('')
  const [myPosts, setMyPosts] = useState([])
  const [friendStats, setFriendStats] = useState({ friends: 0, pendingApprovals: 0, outgoingApprovals: 0 })
  const [approvalNotifications, setApprovalNotifications] = useState([])
  const [announcements, setAnnouncements] = useState([])

  const displayId =
    profile?.id || firebaseUser?.email?.split('@')[0] || firebaseUser?.uid?.slice(0, 8) || '—'

  useEffect(() => {
    if (!profile?.uid) return
    let cancelled = false
    Promise.all([
      getPostsByOwner(profile.uid, profile),
      getUserFriendStats(profile.uid),
      getFriendApprovalNotifications(profile.uid),
      getRecentAnnouncements(5),
    ]).then(([posts, stats, notifs, anncs]) => {
      if (!cancelled) {
        setMyPosts(posts)
        setFriendStats(stats)
        setApprovalNotifications(notifs)
        const dismissed = getDismissedSet()
        setAnnouncements(anncs.filter((a) => !dismissed.has(a.id)))
      }
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, version])

  const sortedPosts = useMemo(
    () => [...myPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [myPosts],
  )

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    await updateProfilePhoto(file)
    setVersion((prev) => prev + 1)
    event.target.value = ''
  }

  const handleApproveFriend = async (requesterUid) => {
    await approveFriendRequest(profile?.uid, requesterUid)
    setVersion((prev) => prev + 1)
  }

  const handleDeclineFriend = async (requesterUid) => {
    await declineFriendRequest(profile?.uid, requesterUid)
    setVersion((prev) => prev + 1)
  }

  const handleBioSave = async () => {
    await updateProfile({ intro: bioText.trim() })
    setVersion((prev) => prev + 1)
    setBioEditing(false)
  }

  return (
    <div className="flex flex-col gap-6 animate-[slideUpFade_0.3s_ease-out] sm:gap-7">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handlePhotoChange}
      />

      <ProfileHeader
        profile={profile}
        handle={`@${displayId}`}
        postsCount={sortedPosts.length}
        friendsCount={friendStats.friends}
        editableAvatar
        onAvatarEdit={() => fileInputRef.current?.click()}
        onAvatarRemove={async () => {
          await clearProfilePhoto()
          setVersion((prev) => prev + 1)
        }}
        hideBio
        secondaryAction={(
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-mono-200 bg-white text-lg font-black text-ink transition hover:bg-mono-100"
            aria-label="설정"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        )}
      />

      {/* 자기소개 */}
      {bioEditing ? (
        <div className="neo-card flex flex-col gap-3 p-4">
          <textarea
            className="neo-input resize-none text-sm"
            rows={2}
            maxLength={60}
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            placeholder="나를 한 줄로 소개해 보세요 (최대 60자)"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBioSave}
              className="neo-btn min-h-0 flex-1 rounded-xl px-4 py-2 text-sm"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => setBioEditing(false)}
              className="neo-btn-outline min-h-0 flex-1 rounded-xl px-4 py-2 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      ) : profile?.intro ? (
        <div className="neo-card flex items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5">
          <p className="line-clamp-2 text-[13px] font-medium leading-[1.7] text-mono-600">{profile.intro}</p>
          <button
            type="button"
            onClick={() => { setBioText(profile.intro || ''); setBioEditing(true) }}
            className="shrink-0 text-[11.5px] font-black text-mono-400 transition hover:text-ink"
          >
            수정
          </button>
        </div>
      ) : null}

      {/* 게시물 / 알림 탭 */}
      <div className="profile-tab-strip">
        <button
          type="button"
          onClick={() => setTab('posts')}
          className={`profile-tab-button ${tab === 'posts' ? 'profile-tab-button-active' : ''}`}
        >
          <span className="inline-flex items-center gap-1.5"><ListIcon className="w-4 h-4" />게시물</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('notifications')}
          className={`profile-tab-button relative ${tab === 'notifications' ? 'profile-tab-button-active' : ''}`}
        >
          <span className="inline-flex items-center gap-1.5"><BellIcon className="w-4 h-4" />알림</span>
          {(approvalNotifications.length + announcements.length) > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-black text-[9px] font-black text-white">
              {(approvalNotifications.length + announcements.length) > 9 ? '9+' : (approvalNotifications.length + announcements.length)}
            </span>
          )}
        </button>
      </div>

      {tab === 'posts' && (
        sortedPosts.length === 0 ? (
          <div className="neo-card px-6 py-8 text-center text-[13px] font-medium text-mono-500">작성한 게시글이 없습니다.</div>
        ) : (
          <ProfilePostList posts={sortedPosts} showAnonymousBadge />
        )
      )}

      {tab === 'notifications' && (
        approvalNotifications.length === 0 && announcements.length === 0 ? (
          <div className="neo-card px-6 py-8 text-center text-[13px] font-medium text-mono-500">
            새로운 알림이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* 공지 알림 */}
            {announcements.map((a) => (
              <div key={a.id} className="neo-card flex flex-col gap-2 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${ANNC_COLOR[a.type] || ANNC_COLOR.notice}`}>
                    {ANNC_LABEL[a.type] || '공지'}
                  </span>
                  <p className="text-[13px] font-black text-ink">{a.title}</p>
                </div>
                <p className="line-clamp-2 text-[12px] font-medium leading-relaxed text-mono-500">{a.body}</p>
              </div>
            ))}

            {/* 친구 요청 알림 */}
            {approvalNotifications.map((item) => (
              <div key={item.id} className="neo-card flex flex-col gap-3 px-4 py-4 sm:px-5">
                <p className="text-[13px] font-medium leading-[1.65] text-ink">
                  {item.requesterNickname}님이 친구로 연결됐어요. 허용하시겠습니까?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="neo-btn min-h-[44px] rounded-xl px-4 py-2 text-xs"
                    onClick={() => handleApproveFriend(item.requesterUid)}
                  >
                    허용
                  </button>
                  <button
                    type="button"
                    className="neo-btn-outline min-h-[44px] rounded-xl px-4 py-2 text-xs"
                    onClick={() => handleDeclineFriend(item.requesterUid)}
                  >
                    보류
                  </button>
                  <button
                    type="button"
                    className="neo-btn-outline min-h-[44px] rounded-xl px-4 py-2 text-xs"
                    onClick={() => navigate(`/users/${item.requesterUid}`)}
                  >
                    프로필 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default MyPage
