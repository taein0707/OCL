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
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[720px] px-3 pb-[max(env(safe-area-inset-bottom),0.85rem)] pt-2 md:hidden"
      aria-label="하단 탭"
    >
      <div className="mx-auto flex w-full max-w-[620px] items-end justify-between gap-1 rounded-t-[30px] border border-b-0 border-mono-200 bg-white/[0.96] p-2 shadow-[0_-18px_40px_-28px_rgba(0,0,0,0.32)] backdrop-blur md:max-w-[680px]">
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
                className="flex w-[76px] -mt-6 flex-col items-center gap-1.5 rounded-[24px] pt-1"
              >
                <span className={`tab-center-shell ${isActive ? 'tab-center-shell-active' : 'tab-center-shell-idle'}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-ink' : 'text-mono-500'}`}>
                  {tab.label}
                </span>
              </NavLink>
            )
          }

          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              aria-label={tab.label}
              className={`flex min-h-[70px] flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-2 pb-1 pt-2 transition-all ${
                isActive ? 'tab-pill-active' : 'tab-pill-idle'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold tracking-tight">{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default MainTabBar
