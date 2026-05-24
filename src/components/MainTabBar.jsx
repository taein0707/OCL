import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
// 🚨 실제 프로젝트 파일(TabIcons.jsx)에 선언되어 있는 순정 명칭들로 완벽하게 조립했습니다.
import { 
  HomeIcon, 
  SearchIcon, 
  CreateIcon, 
  ClassIcon, 
  UserIcon // 🚨 롤업 빌더 검증 결과, 실제 내보내기 이름은 'UserIcon'이 맞습니다!
} from './icons/TabIcons';

// 시스템의 탭 데이터 구조(PlusCircleIcon, AcademicCapIcon, UserIcon 등)와 순정 아이콘 컴포넌트를 정확하게 매핑
const TAB_ICON_MAP = {
  HomeIcon,
  SearchIcon,
  PlusCircleIcon: CreateIcon,
  AcademicCapIcon: ClassIcon,
  UserIcon: UserIcon, // 원래 탭 설정에서 'UserIcon'을 호출하면 순정 'UserIcon'이 나오도록 완벽 매핑
};

function MainTabBar() {
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
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[720px] px-3 pb-[max(env(safe-area-inset-bottom),0.85rem)] pt-2 md:hidden"
      aria-label="하단 탭"
    >
      <div className="mx-auto flex w-full max-w-[620px] items-end justify-between gap-1 rounded-[30px] border border-b-0 border-mono-200/70 bg-white/[0.92] p-2 shadow-[0_-12px_36px_-24px_rgba(0,0,0,0.22)] backdrop-blur-md md:max-w-[680px]">
        {visibleTabs.map((tab) => {
          const Icon = TAB_ICON_MAP[tab.Icon];
          const isCenter = tab.center;

          if (isCenter) {
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={({ isActive }) =>
                  `flex w-[76px] -mt-6 flex-col items-center gap-1.5 rounded-[24px] pt-1 transition-all ${
                    isActive ? 'text-ink font-semibold' : 'text-mono-500'
                  }`
                }
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-md">
                  {Icon && <Icon className="h-6 w-6" />}
                </span>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `flex min-h-[70px] flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-2 pb-1 pt-2 transition-all ${
                  isActive ? 'text-ink font-semibold bg-mono-50' : 'text-mono-500 hover:bg-mono-50/50'
                }`
              }
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="text-[10px] font-semibold tracking-tight">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default MainTabBar;