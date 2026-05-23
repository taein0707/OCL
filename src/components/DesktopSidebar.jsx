import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAppSettings } from '../context/AppSettingsContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { TAB_DEFINITIONS, POPULAR_SEARCH_TERMS } from '../constants/appSettings.js'
import { TAB_ICON_MAP } from './icons/TabIcons.jsx'
import Logo from './Logo.jsx'
import { getUserFriendStats } from '../services/community.js'

function DesktopSidebar() {
  const { settings } = useAppSettings()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = settings.tabOrder
    .filter((id) => settings.enabledTabs.includes(id))
    .map((id) => ({ id, ...TAB_DEFINITIONS[id] }))
    .filter(Boolean)

  const pendingCount = profile?.uid ? getUserFriendStats(profile.uid).pendingApprovals : 0

  return (
    <aside className="hidden w-[260px] shrink-0 self-start sticky top-6 md:block">
      <div className="flex min-h-[calc(100svh-3rem)] flex-col rounded-[32px] border border-mono-200 bg-white/[0.88] p-5 shadow-[0_36px_80px_-50px_rgba(0,0,0,0.42)] backdrop-blur-sm">
        <div className="border-b border-mono-200 pb-5">
          <Logo size="md" />
        </div>

        <nav className="mt-5 flex flex-col gap-2" aria-label="데스크톱 메뉴">
          {tabs.map((tab) => {
            const Icon = TAB_ICON_MAP[tab.Icon]
            const isActive = location.pathname === tab.path
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                aria-label={tab.label}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                  isActive ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-black tracking-tight">{tab.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4 rounded-[24px] border border-mono-200 bg-mono-50 px-4 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mono-500">인기 검색어</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {POPULAR_SEARCH_TERMS.map((term) => (
                <NavLink
                  key={term}
                  to={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-mono-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-mono-600 transition hover:bg-mono-100"
                >
                  {term}
                </NavLink>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/my')}
            className="neo-btn-outline relative w-full justify-center rounded-full px-4 py-2 text-sm"
          >
            알림 확인
            {pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-black text-[9px] font-black text-white">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default DesktopSidebar
