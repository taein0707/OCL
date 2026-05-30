import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import MainTabBar from '../components/MainTabBar.jsx'
import DesktopSidebar from '../components/DesktopSidebar.jsx'
import PermissionFlowGate from '../components/permissions/PermissionFlowGate.jsx'

function MainLayout() {
  const location = useLocation()
  const contentRef = useRef(null)

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="min-h-[100svh] bg-transparent text-ink sm:min-h-[100dvh] md:h-[100dvh] md:overflow-hidden md:pb-0"
      style={{ paddingBottom: 'max(72px, calc(72px + env(safe-area-inset-bottom)))' }}
    >
      <div className="mx-auto flex w-full max-w-[1200px] items-start gap-5 px-3 py-3 sm:px-6 sm:py-6 md:h-full md:items-stretch xl:gap-7">
        <DesktopSidebar />

        <div
          ref={contentRef}
          className="flex min-w-0 flex-1 flex-col rounded-[28px] border border-mono-200/70 bg-white/[0.82] shadow-[0_32px_72px_-52px_rgba(0,0,0,0.36)] backdrop-blur-sm md:h-full md:overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', willChange: 'transform' }}
        >
          <header className="sticky top-0 z-40 border-b border-mono-200/60 bg-white/[0.88] px-5 py-3.5 backdrop-blur-md md:hidden">
            <Logo size="md" />
          </header>

          <main className="flex-1 px-4 py-6 pb-10 sm:px-5 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>

      <MainTabBar />
      <PermissionFlowGate />
    </div>
  )
}

export default MainLayout
