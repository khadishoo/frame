import { Router } from 'express';
import { loadRecord, requireRole } from '../../middleware/access.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as tasksController from './tasks.controller.js';
import {
  createTaskSchema,
  listProjectTasksSchema,
  listWorkspaceTasksSchema,
  moveTaskSchema,
  updateTaskSchema,
} from './tasks.schema.js';

/** /projects/:id/tasks — после loadRecord('projects') (req.record — проект). */
export const projectTasksRouter = Router({ mergeParams: true });

projectTasksRouter.get(
  '/',
  validate(listProjectTasksSchema),
  asyncHandler(tasksController.listForProject),
);
projectTasksRouter.post(
  '/',
  requireRole('member'),
  validate(createTaskSchema),
  asyncHandler(tasksController.create),
);

/** /workspaces/:wsId/tasks — после loadWorkspace. */
export const workspaceTasksRouter = Router({ mergeParams: true });

workspaceTasksRouter.get(
  '/',
  validate(listWorkspaceTasksSchema),
  asyncHandler(tasksController.listForWorkspace),
);

/** /tasks/:id — задача ищется только через проекты пространств пользователя. */
export const tasksRouter = Router();

tasksRouter.use('/:id', loadRecord('tasks', 'Задача не найдена'));

tasksRouter.get('/:id', asyncHandler(tasksController.get));
tasksRouter.patch(
  '/:id',
  requireRole('member'),
  validate(updateTaskSchema),
  asyncHandler(tasksController.update),
);
tasksRouter.patch(
  '/:id/move',
  requireRole('member'),
  validate(moveTaskSchema),
  asyncHandler(tasksController.move),
);
tasksRouter.delete('/:id', requireRole('member'), asyncHandler(tasksController.remove));
