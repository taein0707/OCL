import { Outlet } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import MainTabBar from '../components/MainTabBar.jsx'
import DesktopSidebar from '../components/DesktopSidebar.jsx'

function MainLayout() {
  return (
    <div className="min-h-[100svh] bg-transparent pb-[106px] text-ink sm:min-h-[100dvh] md:pb-0">
      <div className="mx-auto flex w-full max-w-[1200px] items-start gap-5 px-4 py-4 sm:px-6 sm:py-6 xl:gap-7">
        <DesktopSidebar />

        <div className="flex min-w-0 flex-1 flex-col rounded-[32px] border border-mono-200 bg-white/[0.78] shadow-[0_36px_80px_-50px_rgba(0,0,0,0.48)] backdrop-blur-sm">
          <header className="sticky top-0 z-40 border-b border-mono-200 bg-white/[0.9] px-5 py-4 backdrop-blur md:hidden">
            <Logo size="md" />
          </header>

          <main className="flex-1 px-4 py-5 pb-8 sm:px-5 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>

      <MainTabBar />
    </div>
  )
}

export default MainLayout
