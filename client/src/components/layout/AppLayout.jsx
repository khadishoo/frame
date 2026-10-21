import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ProjectFormModal } from '@/features/projects/components/ProjectFormModal';
import { MobileDrawer, MobileTabBar } from './MobileNav';

/**
 * Каркас приложения (/app/*):
 * ≥ 1024 px — полный сайдбар; 768–1023 px — сайдбар-иконки;
 * < 768 px — выдвижное меню + нижний таб-бар.
 */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-bg">
      <a
        href="#main"
        className="focus-ring sr-only z-50 rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Перейти к содержимому
      </a>

      <Sidebar className="fixed inset-y-0 left-0 z-20 hidden w-[72px] border-r border-border md:flex lg:w-64" />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-h-dvh flex-col md:pl-[72px] lg:pl-64">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <main id="main" className="flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileTabBar />
      <ProjectFormModal />
    </div>
  );
}
