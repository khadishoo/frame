import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeProject } from '@/test/utils';
import { ProjectCard, ProjectRow } from '../components/ProjectCard';

const renderCard = (project, Component = ProjectCard) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <Component project={project} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const tags = ['лофи', 'черновик', 'срочно', 'портфолио', 'зин'].map((name, i) => ({
  id: `t-${i}`,
  name,
  color: 'gray',
}));

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('ссылка на страницу проекта, название, тип, категория, статус', () => {
    renderCard(makeProject({ category: { id: 'c-1', name: 'Для себя', color: 'violet' } }));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/app/projects/p-1');
    expect(within(link).getByText('Альбом «Север»')).toBeInTheDocument();
    expect(within(link).getByText('Для себя')).toBeInTheDocument();
    expect(within(link).getByText('В работе')).toBeInTheDocument();
  });

  it('просроченный дедлайн — красным и с числом дней', () => {
    renderCard(makeProject({ dueDate: '2026-10-18' }));
    const due = screen.getByText('Просрочено на 3 дня');
    expect(due.closest('[data-tone]')).toHaveAttribute('data-tone', 'overdue');
    expect(due.closest('[data-tone]')).toHaveClass('text-danger');
  });

  it('скорый дедлайн — «через N дней»', () => {
    renderCard(makeProject({ dueDate: '2026-10-24' }));
    expect(screen.getByText('через 3 дня')).toBeInTheDocument();
  });

  it('у завершённого проекта прошедший дедлайн не «просрочен»', () => {
    renderCard(makeProject({ status: 'completed', dueDate: '2026-10-18' }));
    expect(screen.queryByText(/Просрочено/)).not.toBeInTheDocument();
    expect(screen.getByText('Завершён')).toBeInTheDocument();
  });

  it('кольцо прогресса показывает процент и сколько задач готово', () => {
    renderCard(makeProject({ progress: 40, taskCounts: { total: 5, done: 2 } }));
    const ring = screen.getByRole('progressbar');
    expect(ring).toHaveAttribute('aria-valuenow', '40');
    expect(ring).toHaveAccessibleName('Прогресс: 40% (2 из 5 задач)');
  });

  it('до трёх тегов, остальные — «+N»', () => {
    renderCard(makeProject({ tags }));
    expect(screen.getByText('#лофи')).toBeInTheDocument();
    expect(screen.getByText('#срочно')).toBeInTheDocument();
    expect(screen.queryByText('#портфолио')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toHaveAttribute('title', 'портфолио, зин');
  });

  it('архивный проект помечен', () => {
    renderCard(makeProject({ archivedAt: '2026-10-20T10:00:00.000Z' }));
    expect(screen.getByText('В архиве')).toBeInTheDocument();
  });

  it('строка списка — та же информация компактно', () => {
    renderCard(makeProject({ dueDate: '2026-10-18', progress: 75, tags }), ProjectRow);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/app/projects/p-1');
    expect(screen.getAllByText('Просрочено на 3 дня').length).toBeGreaterThan(0);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });
});
