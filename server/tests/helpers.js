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
