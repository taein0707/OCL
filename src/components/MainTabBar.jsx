import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAppSettings } from '../context/AppSettingsContext'
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

function MainTabBar() {
  const { settings } = useAppSettings()
  const location = useLocation()

  // 원래 정의되어 있던 탭 배열 데이터 (없을 때를 대비해 빈 배열 안전장치 추가)
  const tabs = settings?.tabs || [
    { id: 'home', label: '홈', path: '/', Icon: 'HomeIcon' },
    { id: 'search', label: '검색', path: '/search', Icon: 'SearchIcon' },
    { id: 'create', label: '글쓰기', path: '/create', Icon: 'PlusCircleIcon' },
    { id: 'class', label: '클래스', path: '/class', Icon: 'AcademicCapIcon' },
    { id: 'mypage', label: '마이페이지', path: '/mypage', Icon: 'UserIcon' }
  ]

  // 🚨 filter 시 undefined 크래시 방지용 안전장치 추가
  const visibleTabs = tabs?.filter ? tabs.filter(tab => !tab.hidden) : tabs

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 w-full pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="하단 탭">
      <div className="flex w-full items-center justify-around border-t border-gray-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur-md">
        {visibleTabs.map((tab) => {
          const Icon = TAB_ICON_MAP[tab.Icon] || HomeIcon
          const isActive = location.pathname === tab.path

          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) => 
                `flex flex-1 flex-col items-center justify-center py-1 transition-all ${
                  isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default MainTabBar