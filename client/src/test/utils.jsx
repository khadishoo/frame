import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';

/**
 * Рендер с TanStack Query и «data router» (нужен для useSearchParams/useBlocker).
 * routes — [{ path, element }], url — начальный адрес. Возвращает router, чтобы
 * проверять router.state.location и переходить назад.
 */
export const renderWithProviders = (routes, { url = '/' } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, router, queryClient };
};

export const demoWorkspace = {
  id: 'ws-1',
  name: 'Личное пространство',
  isPersonal: true,
  role: 'owner',
};

export const makeProject = (overrides = {}) => ({
  id: 'p-1',
  workspaceId: demoWorkspace.id,
  title: 'Альбом «Север»',
  description: null,
  type: 'music',
  status: 'active',
  visibility: 'private',
  color: null,
  coverUrl: null,
  startDate: null,
  dueDate: null,
  archivedAt: null,
  createdBy: 'u-1',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  category: null,
  tags: [],
  progress: 0,
  taskCounts: { total: 0, done: 0 },
  ...overrides,
});
