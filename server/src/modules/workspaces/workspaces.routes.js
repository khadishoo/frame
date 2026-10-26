import { Router } from 'express';
import { loadWorkspace } from '../../middleware/access.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { categoryRouters, tagRouters } from '../labels/labels.routes.js';
import { workspaceNotesRouter } from '../notes/notes.routes.js';
import { workspaceProjectsRouter } from '../projects/projects.routes.js';
import { workspaceTasksRouter } from '../tasks/tasks.routes.js';
import { listUserWorkspaces } from './workspaces.service.js';

export const workspacesRouter = Router();

// GET /workspaces — пространства пользователя с его ролью
workspacesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: await listUserWorkspaces(req.user.id) });
  }),
);

// Всё внутри /workspaces/:wsId — только для участников (иначе 404)
const workspaceRouter = Router({ mergeParams: true });
workspaceRouter.use(loadWorkspace);
workspaceRouter.use('/projects', workspaceProjectsRouter);
workspaceRouter.use('/categories', categoryRouters.collection);
workspaceRouter.use('/tags', tagRouters.collection);
workspaceRouter.use('/tasks', workspaceTasksRouter);
workspaceRouter.use('/notes', workspaceNotesRouter);

workspacesRouter.use('/:wsId', workspaceRouter);
