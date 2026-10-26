import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { hashToken } from '../src/utils/tokens.js';
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

const activeSessions = () => db('refresh_tokens').whereNull('revoked_at').count({ n: '*' }).first();

describe('POST /auth/register', () => {
  it('создаёт пользователя, личное пространство и сессию', async () => {
    const res = await registerUser({ ...validUser, email: '  Anna@Example.COM ' });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'anna@example.com', name: 'Анна' });
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(res.body.user).not.toHaveProperty('passwordHash');

    // Пароль в БД — только argon2-хэш
    const user = await db('users').where({ id: res.body.user.id }).first();
    expect(user.password_hash).toMatch(/^\$argon2id\$/);

    // Личное пространство, где пользователь — владелец
    const workspace = await db('workspaces').where({ owner_id: user.id }).first();
    expect(workspace).toMatchObject({ is_personal: true, name: 'Личное пространство' });
    const membership = await db('workspace_members').where({ workspace_id: workspace.id }).first();
    expect(membership).toMatchObject({ user_id: user.id, role: 'owner' });
  });

  it('ставит refresh-токен в httpOnly cookie, а в БД хранит только его хэш', async () => {
    const res = await registerUser();
    const setCookie = getRefreshSetCookie(res);

    expect(setCookie).toBeDefined();
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(setCookie).toMatch(/Max-Age=2592000/); // 30 дней
    expect(setCookie).not.toMatch(/Secure/i); // Secure — только в production

    const rawToken = refreshCookieOf(res).split('=')[1];
    const session = await db('refresh_tokens').first();
    expect(session.token_hash).toBe(hashToken(rawToken));
    expect(session.token_hash).not.toBe(rawToken);
  });

  it('повторная регистрация с тем же email (в любом регистре) → 409', async () => {
    await registerUser();
    const res = await registerUser({ ...validUser, email: 'ANNA@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
    expect(await db('users').count({ n: '*' }).first()).toEqual({ n: '1' });
  });

  it('невалидные данные → 400 с ошибками по каждому полю', async () => {
    const res = await registerUser({ email: 'not-an-email', password: 'short', name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['body.email', 'body.password', 'body.name']));
  });
});

describe('POST /auth/login', () => {
  it('верные данные → 200, access-токен и refresh cookie', async () => {
    await registerUser();
    const res = await loginUser();

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(validUser.email);
    expect(getRefreshSetCookie(res)).toMatch(/HttpOnly/i);
  });

  it('неверный пароль и несуществующий email → одинаковая ошибка 401', async () => {
    await registerUser();
    const wrongPassword = await loginUser({ email: validUser.email, password: 'wrong-password' });
    const unknownEmail = await loginUser({ email: 'ghost@example.com', password: 'whatever1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
    expect(getRefreshSetCookie(wrongPassword)).toBeUndefined();
  });
});

describe('GET /auth/me', () => {
  it('с токеном → пользователь и его пространства', async () => {
    const { body } = await registerUser();
    const res = await meWith(body.accessToken);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(body.user.id);
    expect(res.body.workspaces).toHaveLength(1);
    expect(res.body.workspaces[0]).toMatchObject({ isPersonal: true, role: 'owner' });
  });

  it('без токена → 401', async () => {
    const res = await meWith();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('с поддельным токеном → 401', async () => {
    const forged = jwt.sign({}, 'not-the-real-secret-not-the-real-secret', { subject: 'x' });
    const res = await meWith(forged);
    expect(res.status).toBe(401);
  });

  it('с истёкшим токеном → 401 TOKEN_EXPIRED', async () => {
    const { body } = await registerUser();
    const expired = jwt.sign({}, env.JWT_ACCESS_SECRET, {
      subject: body.user.id,
      expiresIn: -10,
    });
    const res = await meWith(expired);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });
});

describe('POST /auth/refresh', () => {
  it('выдаёт новую пару токенов и отзывает старый refresh (ротация)', async () => {
    const login = await registerUser();
    const oldCookie = refreshCookieOf(login);

    const res = await refreshWith(oldCookie);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
    const newCookie = refreshCookieOf(res);
    expect(newCookie).toBeDefined();
    expect(newCookie).not.toBe(oldCookie);
    expect((await meWith(res.body.accessToken)).status).toBe(200);

    const old = await db('refresh_tokens')
      .where({ token_hash: hashToken(oldCookie.split('=')[1]) })
      .first();
    expect(old.revoked_at).not.toBeNull();
  });

  it('без cookie → 401', async () => {
    const res = await refreshWith();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('повторное использование старого refresh → 401 и отзыв ВСЕХ сессий', async () => {
    const first = await registerUser();
    const otherDevice = await loginUser(); // вторая сессия того же пользователя
    const stolenCookie = refreshCookieOf(first);

    const rotated = await refreshWith(stolenCookie);
    expect(rotated.status).toBe(200);

    // Старый (уже использованный) токен приходит ещё раз — признак кражи
    const reuse = await refreshWith(stolenCookie);
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('REFRESH_TOKEN_REUSED');

    expect(await activeSessions()).toEqual({ n: '0' });
    expect((await refreshWith(refreshCookieOf(rotated))).status).toBe(401);
    expect((await refreshWith(refreshCookieOf(otherDevice))).status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('отзывает refresh-токен и очищает cookie', async () => {
    const login = await registerUser();
    const cookie = refreshCookieOf(login);

    const res = await api().post('/api/v1/auth/logout').set('Cookie', cookie);

    expect(res.status).toBe(204);
    expect(getRefreshSetCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(await activeSessions()).toEqual({ n: '0' });
    expect((await refreshWith(cookie)).status).toBe(401);
  });

  it('без cookie — тоже 204 (выйти можно всегда)', async () => {
    const res = await api().post('/api/v1/auth/logout');
    expect(res.status).toBe(204);
  });
});

describe('Rate limit', () => {
  it('6-я попытка входа за минуту → 429', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await loginUser({ email: 'ghost@example.com', password: 'whatever1' });
      expect(res.status).toBe(401);
    }
    const blocked = await loginUser({ email: 'ghost@example.com', password: 'whatever1' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(blocked.headers.ratelimit).toBeDefined();
  });

  it('6-я регистрация за минуту → 429', async () => {
    for (let i = 0; i < 5; i += 1) {
      await registerUser({ ...validUser, email: `user${i}@example.com` });
    }
    const blocked = await registerUser({ ...validUser, email: 'user5@example.com' });
    expect(blocked.status).toBe(429);
  });

  it('refresh: 31-й запрос за минуту → 429 (перебор refresh-токенов)', async () => {
    for (let i = 0; i < 30; i += 1) {
      const res = await api().post('/api/v1/auth/refresh');
      expect(res.status).toBe(401);
    }
    const blocked = await api().post('/api/v1/auth/refresh');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});

describe('Сценарий целиком (PLAN, этап 4)', () => {
  it('register → login → me → refresh → logout → повторный refresh = 401', async () => {
    expect((await registerUser()).status).toBe(201);

    const login = await loginUser();
    expect(login.status).toBe(200);

    expect((await meWith(login.body.accessToken)).status).toBe(200);

    const refreshed = await refreshWith(refreshCookieOf(login));
    expect(refreshed.status).toBe(200);
    const cookie = refreshCookieOf(refreshed);

    const logout = await api().post('/api/v1/auth/logout').set('Cookie', cookie);
    expect(logout.status).toBe(204);

    expect((await refreshWith(cookie)).status).toBe(401);
  });
});
