import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { search } from './search.service.js';

export const searchSchema = z.object({
  query: z.object({
    q: z
      .string({ error: 'Введите запрос' })
      .trim()
      .min(2, 'Запрос — от 2 символов')
      .max(100, 'Слишком длинный запрос'),
  }),
});

/** /workspaces/:wsId/search?q= — после loadWorkspace (ищем только в своём пространстве). */
export const searchRouter = Router({ mergeParams: true });

searchRouter.get(
  '/',
  validate(searchSchema),
  asyncHandler(async (req, res) => {
    res.json(await search(req.membership.workspaceId, req.validated.query.q));
  }),
);
