import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { search } from '@/api/search';
import { listWorkspaces } from '@/api/workspaces';
import { useAuthStore } from '@/features/auth/authStore';
import { demoWorkspace, renderWithProviders } from '@/test/utils';
import { GlobalSearch } from '../components/GlobalSearch';
import { SEARCH_DEBOUNCE } from '../hooks/useSearch';

vi.mock('@/api/search', () => ({ search: vi.fn() }));
vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));

const results = {
  q: 'свет',
  projects: [
    { id: 'p1', title: 'Свет в окне', type: 'photo', status: 'active', snippet: null },
    {
      id: 'p2',
      title: 'Клип',
      type: 'video',
      status: 'active',
      snippet: '…нужен свет и дым…',
    },
  ],
  tasks: [
    {
      id: 't1',
      title: 'Арендовать свет',
      status: 'todo',
      dueDate: null,
      project: { id: 'p2', title: 'Клип', type: 'video' },
    },
  ],
  notes: [{ id: 'n1', title: '', color: 'amber', snippet: 'Тёплый свет на закате' }],
};
const empty = { q: 'квант', projects: [], tasks: [], notes: [] };

// Desktop или телефон — по медиазапросу (min-width: 640px)
const setDesktop = (desktop) => {
  window.matchMedia = (query) => ({
    matches: desktop && query.includes('min-width: 640px'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
};

const renderSearch = () =>
  renderWithProviders(
    [
      { path: '/app', element: <GlobalSearch /> },
      { path: '/app/projects/:id', element: <p>Страница проекта</p> },
      { path: '/app/ideas/:id', element: <p>Редактор идеи</p> },
    ],
    { url: '/app' },
  );

const field = () => screen.getAllByRole('combobox', { name: /Поиск по проектам/ })[0];

beforeEach(() => {
  setDesktop(true);
  vi.mocked(listWorkspaces).mockResolvedValue({ items: [demoWorkspace] });
  useAuthStore.setState({ status: 'authenticated', user: { id: 'u-1' }, accessToken: 'jwt' });
  vi.mocked(search)
    .mockReset()
    .mockImplementation(async (_ws, q) => (q.startsWith('квант') ? { ...empty, q } : results));
});
afterEach(() => setDesktop(false));

describe('Поиск в топбаре', () => {
  it(`debounce ${SEARCH_DEBOUNCE} мс: один запрос на слово, а не на каждую букву`, async () => {
    const ui = userEvent.setup();
    renderSearch();
    await waitFor(() => expect(listWorkspaces).toHaveBeenCalled());

    await ui.type(field(), 'свет');
    expect(search).not.toHaveBeenCalled();

    await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
    expect(search).toHaveBeenCalledWith(demoWorkspace.id, 'свет', expect.any(AbortSignal));
  });

  it('группы «Проекты / Задачи / Заметки» и подсветка совпадений', async () => {
    const ui = userEvent.setup();
    renderSearch();
    await ui.type(field(), 'свет');

    const listbox = await screen.findByRole('listbox', { name: 'Результаты поиска' });
    expect(within(listbox).getByRole('group', { name: 'Проекты' })).toBeInTheDocument();
    expect(within(listbox).getByRole('group', { name: 'Задачи' })).toBeInTheDocument();
    expect(within(listbox).getByRole('group', { name: 'Заметки' })).toBeInTheDocument();
    expect(within(listbox).getAllByRole('option')).toHaveLength(4);

    const marks = [...listbox.querySelectorAll('mark')].map((m) => m.textContent);
    expect(marks).toEqual(['Свет', 'свет', 'свет', 'свет']);
    expect(field()).toHaveAttribute('aria-expanded', 'true');
  });

  it('стрелки выбирают (aria-activedescendant), Enter открывает задачу на доске проекта', async () => {
    const ui = userEvent.setup();
    const { router } = renderSearch();
    await ui.type(field(), 'свет');
    await screen.findByRole('listbox');

    await ui.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    const active = screen.getByRole('option', { selected: true });
    expect(field()).toHaveAttribute('aria-activedescendant', active.id);
    expect(active).toHaveTextContent('Арендовать свет');

    await ui.keyboard('{Enter}');
    expect(router.state.location.pathname).toBe('/app/projects/p2');
    expect(router.state.location.search).toBe('?tab=board&task=t1');
  });

  it('↑ с начала — на последний результат; Enter без выбора — первый', async () => {
    const ui = userEvent.setup();
    const { router } = renderSearch();
    await ui.type(field(), 'свет');
    await screen.findByRole('listbox');

    await ui.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Тёплый свет');
    await ui.keyboard('{ArrowDown}'); // по кругу — снова первый
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Свет в окне');

    await ui.clear(field());
    await ui.type(field(), 'свет');
    await screen.findByRole('listbox');
    await ui.keyboard('{Enter}');
    expect(router.state.location.pathname).toBe('/app/projects/p1');
  });

  it('Esc закрывает список; второе Esc очищает поле', async () => {
    const ui = userEvent.setup();
    renderSearch();
    await ui.type(field(), 'свет');
    await screen.findByRole('listbox');

    await ui.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(field()).toHaveValue('свет');
    await ui.keyboard('{Escape}');
    expect(field()).toHaveValue('');
  });

  it('1 символ — подсказка; ничего не найдено — сообщение с запросом', async () => {
    const ui = userEvent.setup();
    renderSearch();
    await ui.type(field(), 'к');
    expect(screen.getByText('Введите ещё хотя бы символ')).toBeInTheDocument();

    await ui.type(field(), 'вант');
    expect(await screen.findByText('По запросу «квант» ничего нет')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Найдено: 0');
  });

  it('Ctrl+K ставит фокус в поиск (и в русской раскладке — key «л»)', async () => {
    renderSearch();
    expect(field()).not.toHaveFocus();
    fireEvent.keyDown(document.body, { key: 'л', code: 'KeyK', ctrlKey: true });
    expect(field()).toHaveFocus();
  });

  it('телефон: кнопка «Поиск» и Ctrl+K открывают поиск на весь экран', async () => {
    setDesktop(false);
    const ui = userEvent.setup();
    const { router } = renderSearch();

    // Ctrl+K на телефоне — полноэкранный поиск; Esc закрывает
    fireEvent.keyDown(document.body, { key: 'k', code: 'KeyK', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Поиск' })).toBeInTheDocument();
    await ui.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await ui.click(screen.getByRole('button', { name: 'Поиск' }));
    const dialog = screen.getByRole('dialog', { name: 'Поиск' });
    const input = within(dialog).getByRole('combobox');
    expect(input).toHaveFocus();

    // Выбор результата пальцем — переход и закрытие полноэкранного поиска
    await ui.type(input, 'свет');
    const note = await within(dialog).findByRole('option', { name: /Тёплый свет на закате/ });
    await ui.click(note);
    expect(router.state.location.pathname).toBe('/app/ideas/n1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
