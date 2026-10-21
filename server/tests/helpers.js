import request from 'supertest';
import { app } from '../src/app.js';

export const api = () => request(app);

export const validUser = {
  email: 'anna@example.com',
  password: 'correct-horse-42',
  name: 'Анна',
};

/** Заголовок Set-Cookie для refresh-токена (или undefined). */
export const getRefreshSetCookie = (res) =>
  [].concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('refresh_token='));

/** «refresh_token=…» — то, что браузер отправит обратно в заголовке Cookie. */
export const refreshCookieOf = (res) => getRefreshSetCookie(res)?.split(';')[0];

export const registerUser = (data = validUser) => api().post('/api/v1/auth/register').send(data);

export const loginUser = ({ email, password } = validUser) =>
  api().post('/api/v1/auth/login').send({ email, password });

export const refreshWith = (cookie) => {
  const req = api().post('/api/v1/auth/refresh');
  return cookie ? req.set('Cookie', cookie) : req;
};

export const meWith = (token) => {
  const req = api().get('/api/v1/auth/me');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

/**
 * Зарегистрировать пользователя и вернуть всё нужное для запросов:
 * { token, user, wsId } — wsId его личного пространства.
 */
export const setupUser = async ({ email = validUser.email, name = validUser.name } = {}) => {
  const res = await registerUser({ ...validUser, email, name });
  const me = await meWith(res.body.accessToken);
  return { token: res.body.accessToken, user: res.body.user, wsId: me.body.workspaces[0].id };
};

/** Запрос от имени пользователя: as(token).get('/api/v1/...') */
export const as = (token) => {
  const withAuth = (req) => req.set('Authorization', `Bearer ${token}`);
  return {
    get: (url) => withAuth(api().get(url)),
    post: (url) => withAuth(api().post(url)),
    patch: (url) => withAuth(api().patch(url)),
    put: (url) => withAuth(api().put(url)),
    delete: (url) => withAuth(api().delete(url)),
  };
};
