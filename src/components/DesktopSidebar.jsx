import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAppSettings } from '../context/AppSettingsContext'
import Logo from './Logo'
import { 
  HomeIcon, 
  SearchIcon, 
  PlusCircleIcon, 
  UserIcon, 
  AcademicCapIcon 
} from './icons/TabIcons'

const TAB_ICON_MAP = {
  HomeIcon: HomeIcon,
  SearchIcon: SearchIcon,
  PlusCircleIcon: PlusCircleIcon,
  AcademicCapIcon: AcademicCapIcon,
  UserIcon: UserIcon
}

function DesktopSidebar() {
  const { settings } = useAppSettings()
  const location = useLocation()

  const tabs = settings?.tabs || [
    { id: 'home', label: '홈', path: '/', Icon: 'HomeIcon' },
    { id: 'search', label: '검색', path: '/search', Icon: 'SearchIcon' },
    { id: 'create', label: '글쓰기', path: '/create', Icon: 'PlusCircleIcon' },
    { id: 'class', label: '클래스', path: '/class', Icon: 'AcademicCapIcon' },
    { id: 'mypage', label: '마이페이지', path: '/mypage', Icon: 'UserIcon' }
  ]

  // 🚨 사이드바 filter 미스매치 오류 완벽 방어
  const visibleTabs = tabs?.filter ? tabs.filter(tab => !tab.hidden) : tabs

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 p-4 sticky top-0">
      <div className="mb-8 px-2">
        <Logo className="h-8 w-auto text-blue-600" />
      </div>
      <nav className="flex-1 space-y-1">
        {visibleTabs.map((tab) => {
          const Icon = TAB_ICON_MAP[tab.Icon] || HomeIcon
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default DesktopSidebar