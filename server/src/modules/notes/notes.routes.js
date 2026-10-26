import { Router } from 'express';
import { loadRecord, requireRole } from '../../middleware/access.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as notesController from './notes.controller.js';
import {
  convertNoteSchema,
  createNoteSchema,
  listNotesSchema,
  updateNoteSchema,
} from './notes.schema.js';

/** /workspaces/:wsId/notes — после loadWorkspace. */
export const workspaceNotesRouter = Router({ mergeParams: true });

workspaceNotesRouter.get('/', validate(listNotesSchema), asyncHandler(notesController.list));
workspaceNotesRouter.post(
  '/',
  requireRole('member'),
  validate(createNoteSchema),
  asyncHandler(notesController.create),
);

/** /notes/:id — заметка ищется только в пространствах пользователя (чужая → 404). */
export const notesRouter = Router();

notesRouter.use('/:id', loadRecord('notes', 'Заметка не найдена'));

notesRouter.get('/:id', asyncHandler(notesController.get));
notesRouter.patch(
  '/:id',
  requireRole('member'),
  validate(updateNoteSchema),
  asyncHandler(notesController.update),
);
notesRouter.delete('/:id', requireRole('member'), asyncHandler(notesController.remove));
notesRouter.post(
  '/:id/convert',
  requireRole('member'),
  validate(convertNoteSchema),
  asyncHandler(notesController.convert),
);
