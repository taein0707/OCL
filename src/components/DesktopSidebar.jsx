import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
import Logo from './Logo';
// 🚨 실제 프로젝트 파일(TabIcons.jsx)에 선언되어 있는 순정 명칭들로 완벽하게 조립했습니다.
import { TAB_ICON_MAP } from './icons/TabIcons';

function DesktopSidebar() {
  const { settings } = useAppSettings();

  const tabs = settings?.tabs || [
    { id: 'home', label: '홈', path: '/home', Icon: 'HomeIcon' },
    { id: 'class', label: '우리 반', path: '/class', Icon: 'ClassIcon' },
    { id: 'create', label: '작성', path: '/create', Icon: 'CreateIcon' },
    { id: 'search', label: '검색', path: '/search', Icon: 'SearchIcon' },
    { id: 'my', label: '프로필', path: '/my', Icon: 'MyIcon' },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col rounded-[32px] border border-mono-200/70 bg-white/80 p-5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.08)] backdrop-blur-md md:flex">
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
                    ? 'shadow-[0_8px_24px_-6px_rgba(0,0,0,0.16)]'
                    : 'text-mono-600 hover:bg-mono-50'
                }`
              }
              style={({ isActive }) => isActive ? { background: 'var(--accent)', color: 'var(--accent-foreground)' } : {}}
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