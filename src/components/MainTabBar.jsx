import { NavLink, useLocation } from 'react-router-dom'
import { useAppSettings } from '../context/AppSettingsContext.jsx'
import { TAB_DEFINITIONS } from '../constants/appSettings.js'
import { TAB_ICON_MAP } from './icons/TabIcons.jsx'

function MainTabBar() {
  const { settings } = useAppSettings()
  const location = useLocation()

  const tabs = settings.tabOrder
    .filter((id) => settings.enabledTabs.includes(id))
    .map((id) => ({ id, ...TAB_DEFINITIONS[id] }))
    .filter(Boolean)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 w-full pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="하단 탭"
    >
      <div className="flex w-full items-center justify-around border-t border-mono-200/70 bg-white/[0.94] px-2 pt-2 pb-2 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.14)] backdrop-blur-md">
        {tabs.map((tab) => {
          const Icon = TAB_ICON_MAP[tab.Icon]
          const isCenter = tab.center
          const isActive = location.pathname === tab.path

          if (isCenter) {
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                aria-label={tab.label}
                className="flex flex-1 flex-col items-center justify-center py-1"
              >
                <span className={`tab-center-shell ${isActive ? 'tab-center-shell-active' : 'tab-center-shell-idle'}`}>
                  <Icon className="h-6 w-6" />
                </span>
              </NavLink>
            )
          }

          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              aria-label={tab.label}
              className={`flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all ${
                isActive ? 'tab-pill-active' : 'tab-pill-idle'
              }`}
            >
              <Icon className="h-5 w-5" />
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default MainTabBar
