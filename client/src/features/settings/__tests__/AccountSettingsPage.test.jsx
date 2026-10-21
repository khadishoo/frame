import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changePassword, deleteMe } from '@/api/users';
import { useAuthStore } from '@/features/auth/authStore';
import AccountSettingsPage from '../pages/AccountSettingsPage';

vi.mock('@/api/users', () => ({ changePassword: vi.fn(), deleteMe: vi.fn() }));

const user = { id: '1', email: 'anna@example.com', name: 'Анна', creativeTypes: [] };

const wrongPassword = (field) => ({
  response: {
    status: 400,
    data: {
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ path: `body.${field}`, message: 'Неверный пароль' }],
      },
    },
  },
});

const renderPage = () => {
  render(
    <MemoryRouter>
      <AccountSettingsPage />
    </MemoryRouter>,
  );
  return userEvent.setup();
};

describe('Настройки → Аккаунт', () => {
  beforeEach(() => {
    vi.mocked(changePassword).mockReset();
    vi.mocked(deleteMe).mockReset();
    useAuthStore.setState({ status: 'authenticated', user, accessToken: 'old', endReason: null });
  });

  it('email показан и не редактируется', () => {
    renderPage();
    const email = screen.getByLabelText('Email');
    expect(email).toHaveValue('anna@example.com');
    expect(email).toHaveAttribute('readonly');
  });

  describe('смена пароля', () => {
    it('пароли не совпадают — ошибка до отправки', async () => {
      const ui = renderPage();
      await ui.type(screen.getByLabelText('Текущий пароль'), 'old-password');
      await ui.type(screen.getByLabelText('Новый пароль'), 'new-password-1');
      await ui.type(screen.getByLabelText('Повторите новый пароль'), 'new-password-2');
      await ui.click(screen.getByRole('button', { name: 'Сменить пароль' }));

      expect(await screen.findByText('Пароли не совпадают')).toBeInTheDocument();
      expect(changePassword).not.toHaveBeenCalled();
    });

    it('неверный текущий пароль — ошибка под этим полем', async () => {
      vi.mocked(changePassword).mockRejectedValue(wrongPassword('currentPassword'));
      const ui = renderPage();
      await ui.type(screen.getByLabelText('Текущий пароль'), 'not-mine');
      await ui.type(screen.getByLabelText('Новый пароль'), 'new-password-1');
      await ui.type(screen.getByLabelText('Повторите новый пароль'), 'new-password-1');
      await ui.click(screen.getByRole('button', { name: 'Сменить пароль' }));

      expect(await screen.findByText('Неверный пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Текущий пароль')).toHaveAttribute('aria-invalid', 'true');
    });

    it('успех — новый токен в памяти, форма очищена', async () => {
      vi.mocked(changePassword).mockResolvedValue({ user, accessToken: 'new' });
      const ui = renderPage();
      await ui.type(screen.getByLabelText('Текущий пароль'), 'old-password');
      await ui.type(screen.getByLabelText('Новый пароль'), 'new-password-1');
      await ui.type(screen.getByLabelText('Повторите новый пароль'), 'new-password-1');
      await ui.click(screen.getByRole('button', { name: 'Сменить пароль' }));

      await vi.waitFor(() => expect(useAuthStore.getState().accessToken).toBe('new'));
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-password-1',
      });
      expect(screen.getByLabelText('Текущий пароль')).toHaveValue('');
    });
  });

  describe('удаление аккаунта', () => {
    const openDialog = async (ui) => {
      await ui.click(screen.getByRole('button', { name: 'Удалить аккаунт' }));
      return screen.findByRole('dialog');
    };

    it('без пароля подтвердить нельзя', async () => {
      const ui = renderPage();
      const dialog = await openDialog(ui);
      expect(within(dialog).getByRole('button', { name: 'Удалить навсегда' })).toBeDisabled();
    });

    it('неверный пароль — ошибка в окне, окно не закрывается', async () => {
      vi.mocked(deleteMe).mockRejectedValue(wrongPassword('password'));
      const ui = renderPage();
      const dialog = await openDialog(ui);

      await ui.type(within(dialog).getByLabelText('Пароль'), 'not-mine');
      await ui.click(within(dialog).getByRole('button', { name: 'Удалить навсегда' }));

      expect(await within(dialog).findByText('Неверный пароль')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(useAuthStore.getState().status).toBe('authenticated');
    });

    it('верный пароль (Enter) — сессия завершена с причиной «удалён»', async () => {
      vi.mocked(deleteMe).mockResolvedValue({});
      const ui = renderPage();
      const dialog = await openDialog(ui);

      await ui.type(within(dialog).getByLabelText('Пароль'), 'my-password{Enter}');

      await vi.waitFor(() =>
        expect(useAuthStore.getState()).toMatchObject({ status: 'guest', endReason: 'deleted' }),
      );
      expect(deleteMe).toHaveBeenCalledWith('my-password');
    });
  });
});
