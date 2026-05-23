function ProfilePostGrid({ posts, showAnonymousBadge = false }) {
  return (
    <div className="grid grid-cols-3 gap-[1px] overflow-hidden rounded-[24px] border border-mono-200 bg-mono-200">
      {posts.map((post, index) => (
        <article key={post.id} className="profile-grid-tile animate-[slideUpFade_0.3s_ease-out]" style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}>
          <div className="profile-grid-overlay">
            <div className="flex items-start justify-between gap-2">
              <span className="profile-grid-chip">{post.board}</span>
              {showAnonymousBadge && post.isAnonymous && <span className="profile-grid-chip">익명</span>}
            </div>
            <div className="mt-auto">
              <h3 className="line-clamp-2 text-[13px] font-black text-white">{post.title}</h3>
              <p className="mt-2 text-[11px] font-semibold text-white/80">공감 {post.vibes ?? post.likes}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ProfilePostGrid
