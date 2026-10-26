import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addFavorite, removeFavorite } from '@/api/favorites';
import { useProject } from '@/features/projects/hooks/useProjects';
import { useToastStore } from '@/lib/toast';
import { makeProject } from '@/test/utils';
import { FavoriteButton } from '../components/FavoriteButton';
import { favoriteKeys, patchFavoriteFlag } from '../hooks/useFavorites';

vi.mock('@/api/favorites', () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  listFavorites: vi.fn(),
}));
vi.mock('@/api/projects', () => ({ getProject: vi.fn(), listProjects: vi.fn() }));
vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));

let queryClient;
const project = makeProject({ isFavorite: false });

// Кнопка читает проект из кэша — как в шапке проекта
function Star() {
  const { data } = useProject(project.id);
  return <FavoriteButton type="project" item={data} />;
}

const renderStar = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Star />
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity }, mutations: { retry: false } },
  });
  queryClient.setQueryData(['project', project.id], project);
  queryClient.setQueryData(favoriteKeys.all, { projects: [], notes: [] });
  useToastStore.setState({ toasts: [] });
  vi.mocked(addFavorite).mockReset();
  vi.mocked(removeFavorite).mockReset();
});

describe('FavoriteButton — оптимистично', () => {
  it('звёздочка загорается сразу, проект сразу в «Избранном»; запрос — добавить', async () => {
    vi.mocked(addFavorite).mockReturnValue(new Promise(() => {})); // ответ ещё не пришёл
    const ui = userEvent.setup();
    renderStar();

    const button = screen.getByRole('button', { name: /Добавить в избранное/ });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await ui.click(button);

    expect(screen.getByRole('button', { name: /Убрать из избранного/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(queryClient.getQueryData(favoriteKeys.all).projects).toEqual([
      expect.objectContaining({ id: project.id, isFavorite: true }),
    ]);
    expect(addFavorite).toHaveBeenCalledWith('project', project.id);
  });

  it('ошибка сервера — звёздочка гаснет обратно и тост', async () => {
    vi.mocked(addFavorite).mockRejectedValue({
      response: { status: 404, data: { error: { message: 'Проект не найден' } } },
    });
    const ui = userEvent.setup();
    renderStar();

    await ui.click(screen.getByRole('button', { name: /Добавить в избранное/ }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Добавить в избранное/ })).toHaveAttribute(
        'aria-pressed',
        'false',
      ),
    );
    expect(queryClient.getQueryData(favoriteKeys.all).projects).toEqual([]);
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({
        variant: 'error',
        title: 'Не удалось добавить в избранное',
        description: 'Проект не найден',
      }),
    ]);
  });

  it('повторный клик — убрать: запрос на удаление', async () => {
    queryClient.setQueryData(['project', project.id], { ...project, isFavorite: true });
    vi.mocked(removeFavorite).mockResolvedValue({});
    const ui = userEvent.setup();
    renderStar();

    await ui.click(screen.getByRole('button', { name: /Убрать из избранного/ }));
    expect(removeFavorite).toHaveBeenCalledWith('project', project.id);
    expect(screen.getByRole('button', { name: /Добавить в избранное/ })).toBeInTheDocument();
  });
});

describe('patchFavoriteFlag — флаг в кэше любой формы', () => {
  it('запись, { items }, «бесконечный» список', () => {
    const p = { id: 'a', isFavorite: false };
    expect(patchFavoriteFlag(p, 'a', true)).toEqual({ id: 'a', isFavorite: true });
    expect(patchFavoriteFlag({ items: [p, { id: 'b' }] }, 'a', true).items[0].isFavorite).toBe(
      true,
    );
    const infinite = { pages: [{ items: [{ id: 'b' }] }, { items: [p] }], pageParams: [0, 12] };
    expect(patchFavoriteFlag(infinite, 'a', true).pages[1].items[0].isFavorite).toBe(true);
    expect(patchFavoriteFlag(undefined, 'a', true)).toBeUndefined();
  });
});
