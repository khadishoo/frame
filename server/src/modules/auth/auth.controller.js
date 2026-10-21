import * as authService from './auth.service.js';
import { REFRESH_COOKIE, clearRefreshCookie, sessionMeta, setRefreshCookie } from './cookies.js';

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
