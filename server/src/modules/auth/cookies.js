import { env } from '../../config/env.js';

export const REFRESH_COOKIE = 'refresh_token';

// Cookie уходит только на /api/v1/auth/* — остальные запросы её не несут.
// Поставить или стереть её сервер может из ответа на любой адрес.
const cookieBase = {
  httpOnly: true, // недоступна из JavaScript → не украсть через XSS
  secure: env.isProd, // в production только по HTTPS
  sameSite: 'lax',
  path: '/api/v1/auth',
};

export const setRefreshCookie = (res, token) =>
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieBase,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });

export const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, cookieBase);

export const sessionMeta = (req) => ({ userAgent: req.get('user-agent') });
