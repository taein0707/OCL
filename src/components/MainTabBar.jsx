import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAppSettings } from '../context/AppSettingsContext'
import { TAB_ICON_MAP } from './icons/TabIcons'
import CreateMenu from './CreateMenu.jsx'

function MainTabBar() {
  const { settings } = useAppSettings()
  const [menuOpen, setMenuOpen] = useState(false)

  const tabs = settings?.tabs || [
    { id: 'home',   label: '홈',    path: '/home',   Icon: 'HomeIcon' },
    { id: 'class',  label: '우리 반', path: '/class',  Icon: 'ClassIcon' },
    { id: 'create', label: '작성',   path: '/create', Icon: 'CreateIcon', center: true },
    { id: 'search', label: '검색',   path: '/search', Icon: 'SearchIcon' },
    { id: 'my',     label: '프로필', path: '/my',     Icon: 'MyIcon' },
  ]

  const visibleTabs = tabs.filter((tab) => !tab.hidden)

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[720px] px-3 pb-[max(env(safe-area-inset-bottom),0.85rem)] pt-2 md:hidden"
        aria-label="하단 탭"
      >
        <div className="mx-auto flex w-full max-w-[620px] items-center justify-between gap-1 rounded-[30px] border border-b-0 border-mono-200/70 bg-white/[0.92] p-2 shadow-[0_-12px_36px_-24px_rgba(0,0,0,0.22)] backdrop-blur-md">
          {visibleTabs.map((tab) => {
            const Icon = TAB_ICON_MAP[tab.Icon]

            if (tab.center) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-label={tab.label}
                  onClick={() => setMenuOpen(true)}
                  className="flex flex-1 flex-col items-center justify-center py-1.5 transition-transform active:scale-90"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full shadow-md"
                    style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                  >
                    {Icon && <Icon className="h-6 w-6" />}
                  </span>
                </button>
              )
            }

            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                aria-label={tab.label}
                className={({ isActive }) =>
                  `flex min-h-[60px] flex-1 flex-col items-center justify-center rounded-[22px] px-2 py-2 transition-all ${
                    isActive ? 'font-semibold bg-mono-50' : 'text-mono-500 active:bg-mono-50'
                  }`
                }
                style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : undefined })}
              >
                {Icon && <Icon className="h-6 w-6" />}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <CreateMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}

export default MainTabBar
