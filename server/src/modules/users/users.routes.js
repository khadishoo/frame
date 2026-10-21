import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as usersController from './users.controller.js';
import { updateMeSchema } from './users.schema.js';

export const usersRouter = Router();

usersRouter.patch(
  '/me',
  requireAuth,
  validate(updateMeSchema),
  asyncHandler(usersController.updateMe),
);
