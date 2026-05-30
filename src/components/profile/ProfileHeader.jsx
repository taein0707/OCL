import ProfileAvatar from '../ProfileAvatar.jsx'

function ProfileHeader({
  profile,
  handle,
  postsCount,
  friendsCount,
  primaryAction,
  secondaryAction,
  editableAvatar = false,
  onAvatarEdit,
  onAvatarRemove,
  showSchoolName = true,
  hideBio = false,
}) {
  const region =
    profile?.school?.address?.split(' ').slice(0, 2).join(' ') ||
    profile?.region ||
    ''

  return (
    <section className="flex flex-col gap-5 animate-[slideUpFade_0.3s_ease-out]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 text-xl font-black text-ink">{handle}</h1>
        {secondaryAction}
      </div>

      <div className="flex items-start gap-5">
        <ProfileAvatar
          profile={profile}
          size="xl"
          editable={editableAvatar}
          onEdit={onAvatarEdit}
          onRemove={onAvatarRemove}
        />

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="animate-[slideUpFade_0.3s_ease-out]">
              <p className="text-lg font-black text-ink">{postsCount}</p>
              <p className="text-xs font-semibold text-mono-500">게시물</p>
            </div>
            <div className="animate-[slideUpFade_0.3s_ease-out]">
              <p className="text-lg font-black text-ink">{friendsCount}</p>
              <p className="text-xs font-semibold text-mono-500">친구</p>
            </div>
          </div>

          <div className="mt-4 flex max-w-sm flex-col gap-1">
            <p className="text-base font-black text-ink">{profile?.nickname || '프로필'}</p>
            <div className="text-xs font-semibold leading-5 text-mono-500">
              {showSchoolName ? (
                <>
                  <p className="truncate">{profile?.school?.name || profile?.schoolName || '학교 미설정'}</p>
                  <p>
                    {profile?.grade ? `${profile.grade}학년` : '학년 미설정'}
                    {' · '}
                    {profile?.classNum ? `${profile.classNum}반` : '반 미설정'}
                  </p>
                </>
              ) : (
                region ? <p>{region}</p> : null
              )}
            </div>
            {!hideBio && (
              <p className="line-clamp-2 max-w-sm text-sm font-semibold leading-5 text-mono-500">
                {profile?.intro || '관심 있는 이야기를 모으는 중이에요.'}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">{primaryAction}</div>
        </div>
      </div>
    </section>
  )
}

export default ProfileHeader
