import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboard } from '@/api/dashboard';
import { listWorkspaces } from '@/api/workspaces';
import { useAuthStore } from '@/features/auth/authStore';
import { demoWorkspace, makeProject, renderWithProviders } from '@/test/utils';
import DashboardPage from '../pages/DashboardPage';

vi.mock('@/api/dashboard', () => ({ getDashboard: vi.fn() }));
vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));

const days = [
  '2026-10-20',
  '2026-10-21',
  '2026-10-22',
  '2026-10-23',
  '2026-10-24',
  '2026-10-25',
  '2026-10-26',
];

const dashboard = (overrides = {}) => ({
  today: '2026-10-26',
  stats: { activeProjects: 4, tasksInProgress: 5, completedThisWeek: 6, overdue: 2 },
  totals: { projects: 8, tasks: 31, notes: 9 },
  activity: days.map((date, i) => ({ date, completed: [0, 1, 0, 2, 0, 3, 0][i] })),
  recentProjects: [makeProject({ id: 'p-1', title: 'Альбом «Север»' })],
  upcomingTasks: [
    {
      id: 't-1',
      title: 'Сведение',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: '2026-10-27',
      project: { id: 'p-1', title: 'Альбом «Север»', type: 'music', color: null },
    },
  ],
  recentNotes: [
    {
      id: 'n-1',
      title: 'Комикс про кота',
      content: '',
      isPinned: false,
      color: null,
      project: null,
      isFavorite: false,
      createdAt: '2026-10-26T10:00:00.000Z',
      updatedAt: '2026-10-26T10:00:00.000Z',
    },
  ],
  ...overrides,
});

const renderPage = () =>
  renderWithProviders([{ path: '/app', element: <DashboardPage /> }], { url: '/app' });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 26, 9, 0)); // понедельник, утро
  vi.mocked(listWorkspaces).mockResolvedValue({ items: [demoWorkspace] });
  useAuthStore.setState({
    status: 'authenticated',
    user: { id: 'u-1', name: 'Анна Петрова' },
    accessToken: 'jwt',
  });
});
afterEach(() => vi.useRealTimers());

describe('Дашборд', () => {
  it('приветствие по времени суток; часовой пояс браузера уходит на сервер', async () => {
    vi.mocked(getDashboard).mockResolvedValue(dashboard());
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Доброе утро, Анна' }),
    ).toBeInTheDocument();
    await screen.findByText('Активные проекты');
    expect(getDashboard).toHaveBeenCalledWith(
      demoWorkspace.id,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });

  it('4 карточки-ссылки; просрочено > 0 — с акцентом', async () => {
    vi.mocked(getDashboard).mockResolvedValue(dashboard());
    renderPage();

    const active = (await screen.findByText('Активные проекты')).closest('a');
    expect(active).toHaveAttribute('href', '/app/projects?status=active');
    expect(within(active).getByText('4')).toBeInTheDocument();

    const overdue = screen.getByText('Просрочено').closest('a');
    expect(overdue).toHaveAttribute('href', '/app/tasks');
    expect(overdue).toHaveClass('border-danger/40');
    expect(within(overdue).getByText('2')).toHaveClass('text-danger');
    expect(screen.getByText(/2 задачи просрочены/)).toBeInTheDocument();
  });

  it('виджеты: дедлайны, проекты, идеи и график по дням', async () => {
    vi.mocked(getDashboard).mockResolvedValue(dashboard());
    renderPage();

    expect(await screen.findByRole('button', { name: /Сведение/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Альбом «Север»/ })).toHaveAttribute(
      'href',
      '/app/projects/p-1',
    );
    expect(screen.getByRole('link', { name: /Комикс про кота/ })).toBeInTheDocument();

    const chart = screen.getByRole('list', { name: 'Выполнено задач по дням' });
    const bars = within(chart).getAllByRole('listitem');
    expect(bars).toHaveLength(7);
    expect(bars[5]).toHaveAccessibleName('воскресенье, 25 октября: 3 задачи');
    expect(bars[6]).toHaveAccessibleName('Сегодня: 0 задач');
    expect(screen.getByText('6 задач')).toBeInTheDocument();
    // Онбординг пройден — его нет
    expect(screen.queryByText('Первые шаги')).not.toBeInTheDocument();
  });

  it('новый пользователь — только онбординг из 3 шагов с кнопками', async () => {
    vi.mocked(getDashboard).mockResolvedValue(
      dashboard({
        stats: { activeProjects: 0, tasksInProgress: 0, completedThisWeek: 0, overdue: 0 },
        totals: { projects: 0, tasks: 0, notes: 0 },
        activity: days.map((date) => ({ date, completed: 0 })),
        recentProjects: [],
        upcomingTasks: [],
        recentNotes: [],
      }),
    );
    renderPage();

    expect(await screen.findByText('Начнём? Три шага — и Frame оживёт')).toBeInTheDocument();
    const steps = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(steps.map((s) => within(s).getAllByText(/./)[1].textContent)).toEqual([
      'Создайте проект',
      'Добавьте задачи',
      'Запишите идею',
    ]);
    expect(screen.getByRole('button', { name: 'Создать проект' })).toBeInTheDocument();
    expect(screen.getByText('Сначала создайте проект')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Записать идею' })).toBeInTheDocument();
    // Пустых виджетов и нулей нет
    expect(screen.queryByText('Активные проекты')).not.toBeInTheDocument();
  });

  it('часть шагов пройдена — компактная плашка с галочками над виджетами', async () => {
    vi.mocked(getDashboard).mockResolvedValue(
      dashboard({ totals: { projects: 1, tasks: 0, notes: 2 } }),
    );
    renderPage();

    expect(await screen.findByText('Первые шаги')).toBeInTheDocument();
    expect(screen.getByText('2 из 3')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Готово')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Открыть доску' })).toHaveAttribute(
      'href',
      '/app/projects/p-1?tab=board',
    );
    expect(screen.getByText('Активные проекты')).toBeInTheDocument();
  });
});
