import { Router } from 'express';
import { requireAuth } from './middleware/requireAuth.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { favoritesRouter } from './modules/favorites/favorites.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { categoryRouters, tagRouters } from './modules/labels/labels.routes.js';
import { notesRouter } from './modules/notes/notes.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { tasksRouter } from './modules/tasks/tasks.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { workspacesRouter } from './modules/workspaces/workspaces.routes.js';

// Все маршруты API v1 подключаются здесь
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);

// Данные пространств — только для вошедших; доступ к конкретной записи проверяется дальше
apiRouter.use('/workspaces', requireAuth, workspacesRouter);
apiRouter.use('/projects', requireAuth, projectsRouter);
apiRouter.use('/categories', requireAuth, categoryRouters.item);
apiRouter.use('/tags', requireAuth, tagRouters.item);
apiRouter.use('/tasks', requireAuth, tasksRouter);
apiRouter.use('/notes', requireAuth, notesRouter);
apiRouter.use('/favorites', requireAuth, favoritesRouter);
