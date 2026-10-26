import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listNotes } from '@/api/notes';
import { listWorkspaces } from '@/api/workspaces';
import { useAuthStore } from '@/features/auth/authStore';
import { demoWorkspace, renderWithProviders } from '@/test/utils';
import IdeasPage from '../pages/IdeasPage';

vi.mock('@/api/notes', () => ({ listNotes: vi.fn() }));
vi.mock('@/api/favorites', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
vi.mock('@/api/projects', () => ({
  listProjects: vi.fn().mockResolvedValue({
    items: [{ id: '11111111-1111-4111-8111-111111111111', title: 'Клип' }],
    total: 1,
    limit: 100,
    offset: 0,
  }),
}));
vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const note = (id, overrides = {}) => ({
  id,
  title: `Идея ${id}`,
  content: '',
  isPinned: false,
  color: null,
  project: null,
  isFavorite: false,
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
  ...overrides,
});
const page = (items) => ({ items, total: items.length, limit: 200, offset: 0 });

const renderPage = (url = '/app/ideas') =>
  renderWithProviders([{ path: '/app/ideas', element: <IdeasPage /> }], { url });
const lastQuery = () => vi.mocked(listNotes).mock.lastCall?.[1];
const search = (router) => Object.fromEntries(new URLSearchParams(router.state.location.search));

beforeEach(() => {
  vi.mocked(listWorkspaces).mockResolvedValue({ items: [demoWorkspace] });
  useAuthStore.setState({ status: 'authenticated', user: { id: 'u-1' }, accessToken: 'jwt' });
  vi.mocked(listNotes).mockReset();
});

describe('Страница «Идеи»', () => {
  it('закреплённые — отдельным блоком сверху; Markdown в карточке — простым текстом', async () => {
    vi.mocked(listNotes).mockResolvedValue(
      page([
        note('1', { isPinned: true, title: 'Главная' }),
        note('2', { content: '## План\n- **жирный** пункт', color: 'amber' }),
        note('3', { title: '' }),
      ]),
    );
    renderPage();

    const pinned = (await screen.findByText('Закреплённые')).closest('section');
    expect(within(pinned).getByText('Главная')).toBeInTheDocument();
    const rest = screen.getByText('Остальные').closest('section');
    expect(within(rest).getByText(/План\s+жирный пункт/)).toBeInTheDocument();
    expect(within(rest).getByText('Без названия')).toBeInTheDocument();
    // Карточка — ссылка в редактор, звёздочка — отдельная кнопка рядом
    expect(within(rest).getAllByRole('link')[0]).toHaveAttribute('href', '/app/ideas/2');
    expect(within(rest).getAllByRole('button', { name: /в избранное/ })).toHaveLength(2);
  });

  it('фильтр по проекту и поиск — в адресе и в запросе', async () => {
    vi.mocked(listNotes).mockResolvedValue(page([note('1')]));
    const ui = userEvent.setup();
    const { router } = renderPage();
    await screen.findByText('Идея 1');

    await ui.selectOptions(screen.getByRole('combobox', { name: 'Проект' }), PROJECT_ID);
    expect(search(router)).toEqual({ project: PROJECT_ID });
    expect(lastQuery()).toMatchObject({ projectId: PROJECT_ID });

    await ui.type(screen.getByRole('searchbox', { name: 'Поиск по идеям' }), 'кот');
    await vi.waitFor(() => expect(search(router)).toEqual({ project: PROJECT_ID, q: 'кот' }));
    await vi.waitFor(() => expect(lastQuery()).toMatchObject({ q: 'кот', projectId: PROJECT_ID }));
  });

  it('кривой project в адресе игнорируется', async () => {
    vi.mocked(listNotes).mockResolvedValue(page([note('1')]));
    renderPage('/app/ideas?project=abc');
    await screen.findByText('Идея 1');
    expect(lastQuery()).toMatchObject({ projectId: '' });
  });

  it('пусто — «Идей пока нет» с подсказкой про N; по фильтрам пусто — «Ничего не найдено»', async () => {
    vi.mocked(listNotes).mockResolvedValue(page([]));
    const { unmount } = renderPage();
    expect(await screen.findByText('Идей пока нет')).toBeInTheDocument();
    expect(screen.getByText(/Клавиша N/)).toBeInTheDocument();
    unmount();

    const ui = userEvent.setup();
    const { router } = renderPage('/app/ideas?q=zzz');
    expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument();
    await ui.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(search(router)).toEqual({});
  });
});
