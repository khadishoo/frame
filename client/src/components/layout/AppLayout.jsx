import { useState } from 'react';
import { Outlet } from 'react-router';
import { ErrorState } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { QuickIdeaModal } from '@/features/notes/components/QuickIdeaModal';
import { ProjectFormModal } from '@/features/projects/components/ProjectFormModal';
import { TaskPanel } from '@/features/tasks/components/TaskPanel';
import { useWorkspaces } from '@/features/workspaces/workspaceStore';
import { MobileDrawer, MobileTabBar } from './MobileNav';

/**
 * Каркас приложения (/app/*):
 * ≥ 1024 px — полный сайдбар; 768–1023 px — сайдбар-иконки;
 * < 768 px — выдвижное меню + нижний таб-бар.
 */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Без пространства ни один запрос страниц не стартует (enabled: workspaceId) —
  // если список не загрузился, говорим об этом, а не показываем вечный скелетон
  const workspaces = useWorkspaces();
  const workspacesFailed = workspaces.isError && !workspaces.data;

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
            {workspacesFailed ? (
              <ErrorState
                title="Не удалось загрузить пространство"
                error={workspaces.error}
                onRetry={workspaces.refetch}
                retrying={workspaces.isRefetching}
                className="mt-6"
              />
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>

      <MobileTabBar />
      <ProjectFormModal />
      {/* Окно задачи по ?task=<id> — с любой страницы */}
      <TaskPanel />
      {/* Быстрая идея — клавиша N или «+ Создать» */}
      <QuickIdeaModal />
    </div>
  );
}
