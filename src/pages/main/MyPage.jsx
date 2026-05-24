import { useEffect, useRef, useMemo, useState } from 'react'
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

function MyPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { profile, firebaseUser, logout, updateProfilePhoto, clearProfilePhoto, updateProfile } = useAuth()
  const [version, setVersion] = useState(0)
  const [tab, setTab] = useState('posts') // 'posts' | 'notifications'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [bioEditing, setBioEditing] = useState(false)
  const [bioText, setBioText] = useState('')

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const displayId =
    profile?.id || firebaseUser?.email?.split('@')[0] || firebaseUser?.uid?.slice(0, 8) || '—'

  const myPosts = useMemo(() => getPostsByOwner(profile?.uid, profile), [profile, version])
  const friendStats = useMemo(() => getUserFriendStats(profile?.uid), [profile?.uid, version])
  const approvalNotifications = useMemo(
    () => getFriendApprovalNotifications(profile?.uid, profile),
    [profile, version],
  )

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

  const handleApproveFriend = (requesterUid) => {
    approveFriendRequest(profile?.uid, requesterUid)
    setVersion((prev) => prev + 1)
  }

  const handleDeclineFriend = (requesterUid) => {
    declineFriendRequest(profile?.uid, requesterUid)
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
        pendingCount={friendStats.pendingApprovals}
        editableAvatar
        onAvatarEdit={() => fileInputRef.current?.click()}
        onAvatarRemove={async () => {
          await clearProfilePhoto()
          setVersion((prev) => prev + 1)
        }}
        hideBio
        primaryAction={(
          <button
            type="button"
            className="neo-btn-outline flex-1 rounded-xl px-4 py-2 text-sm"
            onClick={() => navigate('/settings')}
          >
            프로필 편집
          </button>
        )}
        secondaryAction={(
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-mono-200 bg-white text-lg font-black text-ink transition hover:bg-mono-100"
              aria-label="더 보기"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[148px] rounded-2xl border border-mono-200 bg-white p-1.5 shadow-lg animate-[slideUpFade_0.15s_ease-out]">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); navigate('/settings') }}
                  className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-mono-100"
                >
                  설정
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false)
                    await logout()
                    navigate('/loading', { replace: true })
                  }}
                  className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-error-text transition hover:bg-mono-100"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
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
      ) : (
        <button
          type="button"
          onClick={() => { setBioText(''); setBioEditing(true) }}
          className="neo-btn-outline w-full rounded-2xl py-3 text-sm"
        >
          + 한 줄 소개 쓰기
        </button>
      )}

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
          {approvalNotifications.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-black text-[9px] font-black text-white">
              {approvalNotifications.length > 9 ? '9+' : approvalNotifications.length}
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
        approvalNotifications.length === 0 ? (
          <div className="neo-card px-6 py-8 text-center text-[13px] font-medium text-mono-500">
            새로운 알림이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
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
