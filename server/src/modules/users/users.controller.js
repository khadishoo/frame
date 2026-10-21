import * as usersService from './users.service.js';

export const updateMe = async (req, res) => {
  const user = await usersService.updateMe(req.user.id, req.validated.body);
  res.json({ user });
};
