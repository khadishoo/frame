import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { listWorkspaces } from '@/api/workspaces';
import { useAuthStore } from '@/features/auth/authStore';

/**
 * Текущее рабочее пространство. Пока у пользователя одно (личное) — берём первое
 * из GET /workspaces; переключатель пространств появится в версии 1.2.
 */
export const useWorkspaceStore = create((set) => ({
  currentWorkspaceId: null,
  setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
}));

// Сменился пользователь (выход, вход под другим аккаунтом) — чужой id не должен остаться
useAuthStore.subscribe((state, prev) => {
  if (state.user?.id !== prev.user?.id) {
    useWorkspaceStore.setState({ currentWorkspaceId: null });
  }
});

export const workspaceKeys = { all: ['workspaces'] };

export const useWorkspaces = () => {
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: listWorkspaces,
    enabled: authenticated,
    staleTime: 5 * 60_000,
    select: (data) => data.items,
  });
};

/** { workspace, workspaceId } — выбранное пространство или первое (личное). */
export const useCurrentWorkspace = () => {
  const { data: workspaces } = useWorkspaces();
  const selectedId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const workspace = workspaces?.find((w) => w.id === selectedId) ?? workspaces?.[0] ?? null;
  return { workspace, workspaceId: workspace?.id ?? null };
};
