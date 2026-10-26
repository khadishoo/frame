import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../authStore';
import { hasSessionHint } from '../sessionHint';

describe('sessionHint — отметка «в браузере была сессия»', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ status: 'loading', user: null, accessToken: null });
  });

  it('вход ставит отметку, выход снимает; токен в хранилище не попадает', () => {
    expect(hasSessionHint()).toBe(false);

    useAuthStore.getState().setSession({ user: { id: 'u-1' }, accessToken: 'secret-jwt' });
    expect(hasSessionHint()).toBe(true);
    expect(JSON.stringify({ ...localStorage })).not.toContain('secret-jwt');

    useAuthStore.getState().clearSession('logout');
    expect(hasSessionHint()).toBe(false);
  });
});
