import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes.js';

// Все маршруты API v1 подключаются здесь
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
