import { describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import {
  api,
  getRefreshSetCookie,
  loginUser,
  meWith,
  refreshCookieOf,
  refreshWith,
  registerUser,
  validUser,
} from './helpers.js';

const NEW_PASSWORD = 'brand-new-secret-7';

const changePassword = (token, body) =>
  api().patch('/api/v1/users/me/password').set('Authorization', `Bearer ${token}`).send(body);

const deleteMe = (token, body) =>
  api().delete('/api/v1/users/me').set('Authorization', `Bearer ${token}`).send(body);

const count = async (table) => Number((await db(table).count({ n: '*' }).first()).n);

describe('PATCH /users/me/password', () => {
  it('меняет пароль: старый больше не подходит, новый — подходит', async () => {
    const { body } = await registerUser();

    const res = await changePassword(body.accessToken, {
      currentPassword: validUser.password,
      newPassword: NEW_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(validUser.email);
    expect((await loginUser()).status).toBe(401);
    expect((await loginUser({ email: validUser.email, password: NEW_PASSWORD })).status).toBe(200);
  });

  it('другие устройства выходят, текущее получает новую рабочую сессию', async () => {
    const first = await registerUser();
    const otherDevice = await loginUser();

    const res = await changePassword(first.body.accessToken, {
      currentPassword: validUser.password,
      newPassword: NEW_PASSWORD,
    });

    // Новая refresh-cookie для этого устройства
    expect(getRefreshSetCookie(res)).toMatch(/HttpOnly/i);
    expect(getRefreshSetCookie(res)).toMatch(/Path=\/api\/v1\/auth/);
    expect((await refreshWith(refreshCookieOf(res))).status).toBe(200);
    expect((await meWith(res.body.accessToken)).status).toBe(200);

    // Старые сессии — и этого, и другого устройства — больше не работают
    expect((await refreshWith(refreshCookieOf(first))).status).toBe(401);
    expect((await refreshWith(refreshCookieOf(otherDevice))).status).toBe(401);
  });

  it('неверный текущий пароль → 400 с ошибкой у поля currentPassword', async () => {
    const { body } = await registerUser();
    const res = await changePassword(body.accessToken, {
      currentPassword: 'not-my-password',
      newPassword: NEW_PASSWORD,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { path: 'body.currentPassword', message: 'Неверный пароль' },
    ]);
    expect((await loginUser()).status).toBe(200); // пароль не изменился
  });

  it('новый пароль короче 8 символов или равен старому → 400 у поля newPassword', async () => {
    const { body } = await registerUser();

    const short = await changePassword(body.accessToken, {
      currentPassword: validUser.password,
      newPassword: 'short',
    });
    expect(short.status).toBe(400);
    expect(short.body.error.details[0].path).toBe('body.newPassword');

    const same = await changePassword(body.accessToken, {
      currentPassword: validUser.password,
      newPassword: validUser.password,
    });
    expect(same.status).toBe(400);
    expect(same.body.error.details[0]).toEqual({
      path: 'body.newPassword',
      message: 'Новый пароль должен отличаться от текущего',
    });
  });

  it('без токена → 401', async () => {
    const res = await api()
      .patch('/api/v1/users/me/password')
      .send({ currentPassword: 'x', newPassword: NEW_PASSWORD });
    expect(res.status).toBe(401);
  });

  it('rate limit: 6-я попытка за минуту → 429', async () => {
    const { body } = await registerUser();
    for (let i = 0; i < 5; i += 1) {
      const res = await changePassword(body.accessToken, {
        currentPassword: 'wrong-password',
        newPassword: NEW_PASSWORD,
      });
      expect(res.status).toBe(400);
    }
    const blocked = await changePassword(body.accessToken, {
      currentPassword: validUser.password,
      newPassword: NEW_PASSWORD,
    });
    expect(blocked.status).toBe(429);
  });
});

describe('DELETE /users/me', () => {
  it('удаляет пользователя вместе с личным пространством и сессиями, чистит cookie', async () => {
    const { body } = await registerUser();
    await loginUser(); // вторая сессия
    // Другой пользователь — его данные трогать нельзя
    await registerUser({ ...validUser, email: 'boris@example.com', name: 'Борис' });

    const res = await deleteMe(body.accessToken, { password: validUser.password });

    expect(res.status).toBe(204);
    expect(getRefreshSetCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(await db('users').where({ id: body.user.id }).first()).toBeUndefined();
    expect(await count('users')).toBe(1);
    expect(await count('workspaces')).toBe(1);
    expect(await count('workspace_members')).toBe(1);
    expect(await db('refresh_tokens').where({ user_id: body.user.id })).toHaveLength(0);
  });

  it('после удаления: вход невозможен, старый access-токен не работает', async () => {
    const { body } = await registerUser();
    await deleteMe(body.accessToken, { password: validUser.password });

    expect((await loginUser()).status).toBe(401);
    expect((await meWith(body.accessToken)).status).toBe(401);
  });

  it('неверный пароль → 400 у поля password, аккаунт на месте', async () => {
    const { body } = await registerUser();
    const res = await deleteMe(body.accessToken, { password: 'not-my-password' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ path: 'body.password', message: 'Неверный пароль' }]);
    expect(await count('users')).toBe(1);
  });

  it('без пароля → 400', async () => {
    const { body } = await registerUser();
    expect((await deleteMe(body.accessToken, {})).status).toBe(400);
  });

  it('rate limit: 6-я попытка за минуту → 429', async () => {
    const { body } = await registerUser();
    for (let i = 0; i < 5; i += 1) {
      await deleteMe(body.accessToken, { password: 'wrong-password' });
    }
    const blocked = await deleteMe(body.accessToken, { password: validUser.password });
    expect(blocked.status).toBe(429);
    expect(await count('users')).toBe(1);
  });
});
