import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
import Logo from './Logo';
// 🚨 실제 프로젝트 파일(TabIcons.jsx)에 선언되어 있는 순정 명칭들로 완벽하게 조립했습니다.
import { 
  HomeIcon, 
  SearchIcon, 
  CreateIcon, 
  ClassIcon, 
  UserIcon // 🚨 롤업 빌더 검증 결과, 실제 내보내기 이름은 'UserIcon'이 맞습니다!
} from './icons/TabIcons';

const TAB_ICON_MAP = {
  HomeIcon,
  SearchIcon,
  PlusCircleIcon: CreateIcon,
  AcademicCapIcon: ClassIcon,
  UserIcon: UserIcon,
};

function DesktopSidebar() {
  const { settings } = useAppSettings();

  const tabs = settings?.tabs || [
    { id: 'home', label: '홈', path: '/', Icon: 'HomeIcon' },
    { id: 'search', label: '검색', path: '/search', Icon: 'SearchIcon' },
    { id: 'create', label: '글쓰기', path: '/create', Icon: 'PlusCircleIcon' },
    { id: 'class', label: '클래스', path: '/class', Icon: 'AcademicCapIcon' },
    { id: 'mypage', label: '마이페이지', path: '/mypage', Icon: 'UserIcon' },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-48px)] w-64 flex-col rounded-[32px] border border-mono-200/70 bg-white/80 p-5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.08)] backdrop-blur-md md:flex">
      <div className="mb-8 px-2">
        <Logo className="h-7" />
      </div>
      <nav className="flex flex-col gap-1">
        {visibleTabs.map((tab) => {
          const Icon = TAB_ICON_MAP[tab.Icon];
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-ink text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.16)]'
                    : 'text-mono-600 hover:bg-mono-50'
                }`
              }
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default DesktopSidebar;