import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as healthController from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', asyncHandler(healthController.getHealth));
