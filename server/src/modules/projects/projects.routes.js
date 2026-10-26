import { Router } from 'express';
import { loadRecord, requireRole } from '../../middleware/access.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { projectTasksRouter } from '../tasks/tasks.routes.js';
import * as projectsController from './projects.controller.js';
import {
  createProjectSchema,
  listProjectsSchema,
  setTagsSchema,
  updateProjectSchema,
} from './projects.schema.js';

/** /workspaces/:wsId/projects — после loadWorkspace (req.membership уже есть). */
export const workspaceProjectsRouter = Router({ mergeParams: true });

workspaceProjectsRouter.get(
  '/',
  validate(listProjectsSchema),
  asyncHandler(projectsController.list),
);
workspaceProjectsRouter.post(
  '/',
  requireRole('member'),
  validate(createProjectSchema),
  asyncHandler(projectsController.create),
);

/** /projects/:id/* — сначала проверка, что проект из пространства пользователя. */
export const projectsRouter = Router();

projectsRouter.use('/:id', loadRecord('projects', 'Проект не найден'));
projectsRouter.use('/:id/tasks', projectTasksRouter);

projectsRouter.get('/:id', asyncHandler(projectsController.get));
projectsRouter.patch(
  '/:id',
  requireRole('member'),
  validate(updateProjectSchema),
  asyncHandler(projectsController.update),
);
projectsRouter.delete('/:id', requireRole('member'), asyncHandler(projectsController.remove));
projectsRouter.put(
  '/:id/tags',
  requireRole('member'),
  validate(setTagsSchema),
  asyncHandler(projectsController.setTags),
);
projectsRouter.post(
  '/:id/archive',
  requireRole('member'),
  asyncHandler(projectsController.archive),
);
projectsRouter.post(
  '/:id/restore',
  requireRole('member'),
  asyncHandler(projectsController.restore),
);
