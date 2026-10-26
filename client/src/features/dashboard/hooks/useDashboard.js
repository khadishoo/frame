import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/api/dashboard';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';

export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const dashboardKeys = { all: ['dashboard'] };

export const useDashboard = () => {
  const { workspaceId } = useCurrentWorkspace();
  const tz = browserTimeZone();
  return useQuery({
    queryKey: [...dashboardKeys.all, workspaceId, tz],
    queryFn: () => getDashboard(workspaceId, tz),
    enabled: Boolean(workspaceId),
    // Сводка зависит от всего сразу (задачи, проекты, идеи) — при каждом возврате на главную
    // перезапрашиваем, а не ждём 30 с глобального staleTime
    staleTime: 0,
  });
};
