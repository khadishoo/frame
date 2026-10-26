import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { moveTask } from '@/api/tasks';
import { useToastStore } from '@/lib/toast';
import { groupByStatus, toIds } from '../board';
import { taskKeys, useMoveTask } from '../hooks/useTasks';

vi.mock('@/api/tasks', () => ({ moveTask: vi.fn() }));
vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));

const task = (id, status, position) => ({ id, status, position, title: id, completedAt: null });
const initial = {
  items: [task('A', 'todo', 1000), task('B', 'todo', 2000), task('C', 'in_progress', 1000)],
};

let queryClient;
const board = () => toIds(groupByStatus(queryClient.getQueryData(taskKeys.project('p-1')).items));

const renderMove = () =>
  renderHook(() => useMoveTask('p-1'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  queryClient.setQueryData(taskKeys.project('p-1'), initial);
  useToastStore.setState({ toasts: [] });
  vi.mocked(moveTask).mockReset();
});

describe('useMoveTask: оптимистичное перемещение', () => {
  it('карточка встаёт на место сразу, до ответа сервера; на сервер уходит место в колонке', async () => {
    vi.mocked(moveTask).mockReturnValue(new Promise(() => {})); // ответ «ещё не пришёл»
    const { result } = renderMove();

    act(() => result.current.move({ id: 'A', status: 'in_progress', index: 1 }));

    expect(board()).toMatchObject({ todo: ['B'], in_progress: ['C', 'A'] });
    await waitFor(() =>
      expect(moveTask).toHaveBeenCalledWith('A', { status: 'in_progress', position: 1 }),
    );
  });

  it('ошибка сервера — откат к прежнему порядку и тост', async () => {
    let fail;
    vi.mocked(moveTask).mockReturnValue(
      new Promise((_, reject) => {
        fail = reject;
      }),
    );
    const { result } = renderMove();

    act(() => result.current.move({ id: 'B', status: 'todo', index: 0 }));
    expect(board().todo).toEqual(['B', 'A']);

    await waitFor(() => expect(moveTask).toHaveBeenCalled());
    await act(async () => {
      fail({ response: { status: 409, data: { error: { message: 'Проект в архиве' } } } });
    });

    await waitFor(() => expect(board().todo).toEqual(['A', 'B']));
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({
        variant: 'error',
        title: 'Карточка вернулась на место',
        description: 'Проект в архиве',
      }),
    ]);
  });
});
