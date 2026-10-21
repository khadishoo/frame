import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateMe } from '@/api/users';
import { useAuthStore } from '@/features/auth/authStore';
import { useToastStore } from '@/lib/toast';
import ProfileSettingsPage from '../pages/ProfileSettingsPage';

vi.mock('@/api/users', () => ({ updateMe: vi.fn() }));

const user = {
  id: '1',
  email: 'anna@example.com',
  name: 'Анна',
  username: null,
  bio: null,
  avatarUrl: null,
  creativeTypes: ['music'],
  theme: 'system',
};

// useBlocker работает только внутри «data router» — поэтому createMemoryRouter
const renderPage = () => {
  const router = createMemoryRouter(
    [
      { path: '/app/settings/profile', element: <ProfileSettingsPage /> },
      { path: '/app', element: <p>Дашборд</p> },
    ],
    { initialEntries: ['/app/settings/profile'] },
  );
  render(<RouterProvider router={router} />);
  return { router, ui: userEvent.setup(), save: screen.getByRole('button', { name: 'Сохранить' }) };
};

describe('Настройки → Профиль', () => {
  beforeEach(() => {
    vi.mocked(updateMe).mockReset();
    useAuthStore.setState({ status: 'authenticated', user, accessToken: 'jwt' });
  });

  it('«Сохранить» неактивна, пока ничего не изменено', async () => {
    const { ui, save } = renderPage();
    expect(save).toBeDisabled();
    expect(screen.getByText('Все изменения сохранены')).toBeInTheDocument();

    await ui.type(screen.getByLabelText('Имя'), ' К.');
    expect(save).toBeEnabled();
    expect(screen.getByText('Есть несохранённые изменения')).toBeInTheDocument();
  });

  it('выбор творческого типа тоже считается изменением', async () => {
    const { ui, save } = renderPage();
    await ui.click(screen.getByRole('button', { name: /Фото/ }));
    expect(save).toBeEnabled();
  });

  it('сохраняет: пустые поля уходят как null, после сохранения кнопка снова неактивна', async () => {
    vi.mocked(updateMe).mockImplementation(async (data) => ({ user: { ...user, ...data } }));
    const { ui, save } = renderPage();

    await ui.type(screen.getByLabelText('Username'), 'anna_draws');
    await ui.click(save);

    await vi.waitFor(() => expect(save).toBeDisabled());
    expect(updateMe).toHaveBeenCalledWith({
      name: 'Анна',
      username: 'anna_draws',
      bio: null,
      creativeTypes: ['music'],
    });
    expect(useAuthStore.getState().user.username).toBe('anna_draws');
    // Тост попал в очередь (рисует его <Toaster />, которого в этом тесте нет)
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      variant: 'success',
      title: 'Профиль сохранён',
    });
  });

  it('занятый username — ошибка под полем', async () => {
    vi.mocked(updateMe).mockRejectedValue({
      response: {
        status: 409,
        data: {
          error: {
            code: 'USERNAME_TAKEN',
            details: [{ path: 'body.username', message: 'Этот username уже занят' }],
          },
        },
      },
    });
    const { ui, save } = renderPage();

    await ui.type(screen.getByLabelText('Username'), 'taken_name');
    await ui.click(save);

    expect(await screen.findByText('Этот username уже занят')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
  });

  it('неверный формат username проверяется ещё до отправки', async () => {
    const { ui, save } = renderPage();
    await ui.type(screen.getByLabelText('Username'), 'анна');
    await ui.click(save);

    expect(await screen.findByText('Только латинские буквы, цифры и _')).toBeInTheDocument();
    expect(updateMe).not.toHaveBeenCalled();
  });

  it('счётчик символов в «О себе»', async () => {
    const { ui } = renderPage();
    expect(screen.getByText('0/300')).toBeInTheDocument();
    await ui.type(screen.getByLabelText('О себе'), 'Рисую');
    expect(screen.getByText('5/300')).toBeInTheDocument();
  });

  it('уход с несохранёнными изменениями — спрашивает подтверждение', async () => {
    const { router, ui } = renderPage();
    await ui.type(screen.getByLabelText('Имя'), '!');

    await router.navigate('/app');
    expect(await screen.findByText('Уйти без сохранения?')).toBeInTheDocument();

    await ui.click(screen.getByRole('button', { name: 'Остаться' }));
    expect(router.state.location.pathname).toBe('/app/settings/profile');

    await router.navigate('/app');
    await ui.click(await screen.findByRole('button', { name: 'Уйти без сохранения' }));
    expect(await screen.findByText('Дашборд')).toBeInTheDocument();
  });
});
