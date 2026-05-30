function DefaultAvatar({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="22" r="12" fill="currentColor" opacity="0.92" />
      <path d="M14 54c2.8-10.6 10.4-16 18-16s15.2 5.4 18 16" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

function ProfileAvatar({ profile, size = 'lg', editable = false, onEdit, onRemove }) {
  const dimensions = size === 'xl' ? 'h-28 w-28' : size === 'md' ? 'h-16 w-16' : 'h-24 w-24'
  const iconSize = size === 'xl' ? 'h-16 w-16' : size === 'md' ? 'h-10 w-10' : 'h-14 w-14'
  const hasPhoto = Boolean(profile?.profilePhoto?.url)

  return (
    <div className={`relative ${dimensions} animate-[slideUpFade_0.3s_ease-out]`} style={{ marginBottom: editable ? '1.5rem' : undefined }}>
      <div className={`profile-avatar-shell ${dimensions}`}>
        {hasPhoto ? (
          <img src={profile.profilePhoto.url} alt="프로필 사진" className={`h-full w-full object-cover ${dimensions}`} />
        ) : (
          <DefaultAvatar className={`${iconSize} text-mono-500`} />
        )}
      </div>
      {editable && (
        <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-mono-200 bg-white px-2.5 py-1 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.25)]">
          <button type="button" onClick={onEdit} className="whitespace-nowrap text-[10px] font-black text-ink">
            변경
          </button>
          {hasPhoto && (
            <>
              <span className="text-[9px] text-mono-300">·</span>
              <button type="button" onClick={onRemove} className="whitespace-nowrap text-[10px] font-black text-mono-500">
                제거
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ProfileAvatar
