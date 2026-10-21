import { clearRefreshCookie, sessionMeta, setRefreshCookie } from '../auth/cookies.js';
import * as usersService from './users.service.js';

export const updateMe = async (req, res) => {
  const user = await usersService.updateMe(req.user.id, req.validated.body);
  res.json({ user });
};

export const changePassword = async (req, res) => {
  const { user, accessToken, refreshToken } = await usersService.changePassword(
    req.user.id,
    req.validated.body,
    sessionMeta(req),
  );
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
};

export const deleteMe = async (req, res) => {
  await usersService.deleteMe(req.user.id, req.validated.body);
  clearRefreshCookie(res);
  res.status(204).end();
};
