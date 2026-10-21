import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateMe } from '@/api/users';
import { useAuthStore } from '@/features/auth/authStore';
import { useThemeStore } from '@/lib/theme';
import { ThemeSync } from '../ThemeSync';

vi.mock('@/api/users', () => ({ updateMe: vi.fn() }));

const profile = { id: '1', name: 'Анна', email: 'anna@example.com', theme: 'dark' };

describe('ThemeSync: тема ↔ профиль', () => {
  beforeEach(() => {
    vi.mocked(updateMe).mockReset();
    vi.mocked(updateMe).mockImplementation(async (data) => ({ user: { ...profile, ...data } }));
    useAuthStore.setState({ status: 'guest', user: null, accessToken: null });
    useThemeStore.getState().setPreference('light');
    render(<ThemeSync />);
  });

  it('при входе применяет тему из профиля и не отправляет её обратно', () => {
    useAuthStore.getState().setSession({ user: profile, accessToken: 'jwt' });

    expect(useThemeStore.getState().preference).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(updateMe).not.toHaveBeenCalled();
  });

  it('вошедший пользователь сменил тему — она сохраняется в профиль', async () => {
    useAuthStore.getState().setSession({ user: profile, accessToken: 'jwt' });

    useThemeStore.getState().setPreference('system');

    expect(updateMe).toHaveBeenCalledWith({ theme: 'system' });
    await vi.waitFor(() => expect(useAuthStore.getState().user.theme).toBe('system'));
  });

  it('гость меняет тему — на сервер ничего не уходит', () => {
    useThemeStore.getState().setPreference('dark');
    expect(updateMe).not.toHaveBeenCalled();
  });
});
