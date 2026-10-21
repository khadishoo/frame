import { Router } from 'express';
import { accountLimiters } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as usersController from './users.controller.js';
import { changePasswordSchema, deleteMeSchema, updateMeSchema } from './users.schema.js';

export const usersRouter = Router();

// Все маршруты модуля — только для вошедших
usersRouter.use(requireAuth);

usersRouter.patch('/me', validate(updateMeSchema), asyncHandler(usersController.updateMe));

usersRouter.patch(
  '/me/password',
  accountLimiters.changePassword,
  validate(changePasswordSchema),
  asyncHandler(usersController.changePassword),
);

usersRouter.delete(
  '/me',
  accountLimiters.deleteAccount,
  validate(deleteMeSchema),
  asyncHandler(usersController.deleteMe),
);
