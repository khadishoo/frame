import { env } from '../../config/env.js';
import * as authService from './auth.service.js';

export const REFRESH_COOKIE = 'refresh_token';

// Cookie уходит только на /api/v1/auth/* — остальные запросы её не несут
const cookieBase = {
  httpOnly: true, // недоступна из JavaScript → не украсть через XSS
  secure: env.isProd, // в production только по HTTPS
  sameSite: 'lax',
  path: '/api/v1/auth',
};

const setRefreshCookie = (res, token) =>
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieBase,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });

const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, cookieBase);

const sessionMeta = (req) => ({ userAgent: req.get('user-agent') });

export const register = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.validated.body,
    sessionMeta(req),
  );
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
};

export const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(
    req.validated.body,
    sessionMeta(req),
  );
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
};

export const refresh = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.refresh(
      req.cookies[REFRESH_COOKIE],
      sessionMeta(req),
    );
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  } catch (err) {
    // Негодный токен больше не нужен браузеру — убираем, чтобы клиент не повторял попытки
    clearRefreshCookie(res);
    throw err;
  }
};

export const logout = async (req, res) => {
  await authService.logout(req.cookies[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.status(204).end();
};

export const me = async (req, res) => {
  res.json(await authService.getMe(req.user.id));
};
