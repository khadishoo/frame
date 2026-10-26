import { Router } from 'express';
import { loginLimiter, registerLimiter, sessionLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authController from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post('/login', loginLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.post('/refresh', sessionLimiter, asyncHandler(authController.refresh));
authRouter.post('/logout', sessionLimiter, asyncHandler(authController.logout));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
