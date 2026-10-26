import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTask } from '@/api/tasks';
import { renderWithProviders } from '@/test/utils';
import { QuickAddTask } from '../components/QuickAddTask';

vi.mock('@/api/tasks', () => ({ createTask: vi.fn() }));
vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));

const renderQuickAdd = () =>
  renderWithProviders([{ path: '/', element: <QuickAddTask projectId="p-1" status="review" /> }]);

const field = () => screen.getByRole('textbox', { name: 'Новая задача в колонке «На проверке»' });

beforeEach(() => {
  vi.mocked(createTask)
    .mockReset()
    .mockImplementation(async (_projectId, data) => ({ id: `t-${data.title}`, ...data }));
});

describe('QuickAddTask', () => {
  it('Enter создаёт задачу в своей колонке и оставляет фокус в пустом поле — для следующей', async () => {
    const ui = userEvent.setup();
    renderQuickAdd();

    await ui.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    expect(field()).toHaveFocus();

    await ui.type(field(), '  Эскиз обложки  {Enter}');
    expect(field()).toHaveValue('');
    expect(field()).toHaveFocus();

    await ui.type(field(), 'Шрифты{Enter}');
    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(2));
    expect(createTask).toHaveBeenNthCalledWith(1, 'p-1', {
      title: 'Эскиз обложки',
      status: 'review',
    });
    expect(createTask).toHaveBeenNthCalledWith(2, 'p-1', { title: 'Шрифты', status: 'review' });
  });

  it('пустой Enter ничего не создаёт', async () => {
    const ui = userEvent.setup();
    renderQuickAdd();
    await ui.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    await ui.type(field(), '   {Enter}');
    expect(createTask).not.toHaveBeenCalled();
  });

  it('Esc — отмена: поле закрывается, текст не сохраняется, фокус на кнопке', async () => {
    const ui = userEvent.setup();
    renderQuickAdd();

    await ui.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    await ui.type(field(), 'Передумала');
    await ui.keyboard('{Escape}');

    const button = screen.getByRole('button', { name: 'Добавить задачу' });
    await waitFor(() => expect(button).toHaveFocus());
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
  });

  it('ошибка сервера — тост и текст возвращается в поле', async () => {
    vi.mocked(createTask).mockRejectedValue({
      response: { status: 409, data: { error: { message: 'Проект в архиве' } } },
    });
    const ui = userEvent.setup();
    renderQuickAdd();

    await ui.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    await ui.type(field(), 'Не выйдет{Enter}');
    await waitFor(() => expect(field()).toHaveValue('Не выйдет'));
  });
});
