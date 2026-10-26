import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/api/auth';
import { useAuthStore } from '../authStore';
import LoginPage from '../pages/LoginPage';

vi.mock('@/api/auth', () => ({ login: vi.fn() }));

const renderLogin = () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
  return {
    user: userEvent.setup(),
    email: screen.getByLabelText('Email'),
    password: screen.getByLabelText('Пароль'),
    submit: screen.getByRole('button', { name: 'Войти' }),
  };
};

const apiError = (status, code) => ({ response: { status, data: { error: { code } } } });

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset();
    useAuthStore.setState({ status: 'guest', user: null, accessToken: null });
  });

  it('пустая форма: ошибки под полями, запрос не уходит', async () => {
    const { user, submit, email } = renderLogin();
    await user.click(submit);

    expect(await screen.findByText('Введите email')).toBeInTheDocument();
    expect(screen.getByText('Введите пароль')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('некорректный email', async () => {
    const { user, submit, email, password } = renderLogin();
    await user.type(email, 'not-an-email');
    await user.type(password, 'secret');
    await user.click(submit);

    expect(await screen.findByText('Некорректный email')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('ошибка 401 от сервера — понятный текст для всей формы', async () => {
    vi.mocked(authApi.login).mockRejectedValue(apiError(401, 'INVALID_CREDENTIALS'));
    const { user, submit, email, password } = renderLogin();
    await user.type(email, 'anna@example.com');
    await user.type(password, 'wrong-password');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль');
  });

  it('429 — сообщение про слишком много попыток', async () => {
    vi.mocked(authApi.login).mockRejectedValue(apiError(429, 'TOO_MANY_REQUESTS'));
    const { user, submit, email, password } = renderLogin();
    await user.type(email, 'anna@example.com');
    await user.type(password, 'whatever');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent('Слишком много попыток');
  });

  it('успешный вход: email нормализован, сессия — только в памяти', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: { id: '1', name: 'Анна' },
      accessToken: 'jwt',
    });
    const { user, submit, email, password } = renderLogin();
    await user.type(email, '  Anna@Example.com ');
    await user.type(password, 'correct-horse');
    await user.click(submit);

    await vi.waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'));
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'anna@example.com',
      password: 'correct-horse',
    });
    expect(useAuthStore.getState().accessToken).toBe('jwt');
    // В хранилище — только отметка «сессия была» (sessionHint), ни токена, ни данных
    expect(Object.keys(window.localStorage)).toEqual(['frame-session']);
    expect(window.localStorage.getItem('frame-session')).toBe('1');
  });

  it('«Войти как демо» входит с демо-аккаунтом, не заполняя форму', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: { id: 'demo', name: 'Мира Соколова' },
      accessToken: 'jwt',
    });
    const { user } = renderLogin();
    await user.click(screen.getByRole('button', { name: 'Войти как демо' }));

    await vi.waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'));
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'demo@frame.local',
      password: 'demo-password',
    });
  });

  it('кнопка «Показать пароль» меняет тип поля', async () => {
    const { user, password } = renderLogin();
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Показать пароль' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});
