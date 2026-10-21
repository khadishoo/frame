import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listLabels } from '@/api/labels';
import { listProjects } from '@/api/projects';
import { listWorkspaces } from '@/api/workspaces';
import { useAuthStore } from '@/features/auth/authStore';
import { demoWorkspace, makeProject, renderWithProviders } from '@/test/utils';
import ProjectsPage from '../pages/ProjectsPage';

vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));
vi.mock('@/api/labels', () => ({ listLabels: vi.fn() }));
vi.mock('@/api/projects', () => ({ listProjects: vi.fn() }));

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const page = (items, total = items.length) => ({ items, total, limit: 12, offset: 0 });

const renderPage = (url = '/app/projects') =>
  renderWithProviders(
    [
      { path: '/app/projects', element: <ProjectsPage /> },
      { path: '/app/projects/:id', element: <p>Проект</p> },
    ],
    { url },
  );

const lastQuery = () => vi.mocked(listProjects).mock.lastCall?.[1];
const search = (router) => Object.fromEntries(new URLSearchParams(router.state.location.search));

describe('Страница «Проекты»: фильтры ↔ адрес', () => {
  beforeEach(() => {
    vi.mocked(listProjects)
      .mockReset()
      .mockResolvedValue(page([makeProject()]));
    vi.mocked(listWorkspaces).mockResolvedValue({ items: [demoWorkspace] });
    vi.mocked(listLabels).mockImplementation(async (kind) =>
      kind === 'categories'
        ? [{ id: CATEGORY_ID, name: 'Работа', color: 'blue', projectCount: 1 }]
        : [],
    );
    useAuthStore.setState({ status: 'authenticated', user: { id: 'u-1' }, accessToken: 'jwt' });
  });

  it('фильтры из ссылки применяются: запрос, нажатый чип, вид «Список»', async () => {
    renderPage(`/app/projects?type=art&status=paused&category=${CATEGORY_ID}&view=list&sort=title`);

    await screen.findByText('Альбом «Север»');
    expect(lastQuery()).toMatchObject({
      type: 'art',
      status: 'paused',
      category: CATEGORY_ID,
      sort: 'title',
      offset: 0,
    });
    expect(screen.getByRole('button', { name: /Рисунок/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('radio', { name: 'Список' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Статус')).toHaveValue('paused');
  });

  it('кривые значения в адресе игнорируются', async () => {
    renderPage('/app/projects?type=pizza&sort=random&category=abc');
    await screen.findByText('Альбом «Север»');
    expect(lastQuery()).toMatchObject({ type: undefined, category: undefined, sort: 'updated_at' });
  });

  it('клик по фильтрам пишет их в адрес; «Назад» возвращает предыдущее состояние', async () => {
    const ui = userEvent.setup();
    const { router } = renderPage();
    await screen.findByText('Альбом «Север»');

    await ui.click(screen.getByRole('button', { name: /Музыка/ }));
    await ui.selectOptions(screen.getByLabelText('Сортировка'), 'due_date');
    await ui.click(screen.getByRole('radio', { name: 'Список' }));

    expect(search(router)).toEqual({ type: 'music', sort: 'due_date', view: 'list' });
    expect(lastQuery()).toMatchObject({ type: 'music', sort: 'due_date' });

    await router.navigate(-1);
    expect(search(router)).toEqual({ type: 'music', sort: 'due_date' });
    await router.navigate(-1);
    expect(search(router)).toEqual({ type: 'music' });
  });

  it('поиск попадает в адрес с задержкой (debounce), а не на каждую букву', async () => {
    const ui = userEvent.setup();
    const { router } = renderPage();
    await screen.findByText('Альбом «Север»');
    const callsBefore = vi.mocked(listProjects).mock.calls.length;

    await ui.type(screen.getByLabelText('Поиск по названию'), 'альбом');
    expect(search(router).q).toBeUndefined(); // ещё не прошло 300 мс

    await vi.waitFor(() => expect(search(router)).toEqual({ q: 'альбом' }));
    await vi.waitFor(() => expect(lastQuery()).toMatchObject({ q: 'альбом' }));
    // Один новый запрос на всё слово
    expect(vi.mocked(listProjects).mock.calls.length - callsBefore).toBe(1);
  });

  it('вкладка «Архив» — status=archived в адресе', async () => {
    const ui = userEvent.setup();
    const { router } = renderPage();
    await screen.findByText('Альбом «Север»');
    await ui.click(screen.getByRole('tab', { name: /Архив/ }));
    expect(search(router)).toEqual({ status: 'archived' });
  });

  it('пустое пространство — «Проектов пока нет»', async () => {
    vi.mocked(listProjects).mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText('Проектов пока нет')).toBeInTheDocument();
  });

  it('по фильтрам ничего — «Ничего не найдено» и сброс фильтров', async () => {
    vi.mocked(listProjects).mockResolvedValue(page([]));
    const ui = userEvent.setup();
    const { router } = renderPage('/app/projects?type=dev&q=zzz&view=list');

    const empty = (await screen.findByText('Ничего не найдено')).closest('div.bg-grain');
    await ui.click(within(empty).getByRole('button', { name: 'Сбросить фильтры' }));
    // Сбрасываются фильтры, но не вид
    expect(search(router)).toEqual({ view: 'list' });
  });

  it('«Показать ещё» догружает следующую страницу', async () => {
    const first = Array.from({ length: 12 }, (_, i) =>
      makeProject({ id: `p-${i}`, title: `Проект ${i}` }),
    );
    vi.mocked(listProjects).mockImplementation(async (_ws, { offset }) =>
      offset === 0
        ? { items: first, total: 13, limit: 12, offset: 0 }
        : {
            items: [makeProject({ id: 'p-12', title: 'Проект 12' })],
            total: 13,
            limit: 12,
            offset: 12,
          },
    );
    const ui = userEvent.setup();
    renderPage();

    await screen.findByText('Проект 0');
    await ui.click(screen.getByRole('button', { name: 'Показать ещё' }));
    expect(await screen.findByText('Проект 12')).toBeInTheDocument();
    expect(lastQuery()).toMatchObject({ offset: 12 });
    expect(screen.queryByRole('button', { name: 'Показать ещё' })).not.toBeInTheDocument();
  });
});
