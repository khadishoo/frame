import { Router } from 'express';
import { z } from 'zod';
import { FAVORITE_TYPES } from '../../config/domain.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as favoritesService from './favorites.service.js';

const typeField = z.enum(FAVORITE_TYPES, { error: `Тип: ${FAVORITE_TYPES.join(', ')}` });
const idField = z.uuid({ error: 'Некорректный id' });

const addSchema = z.object({
  body: z.object({ type: typeField, id: idField }, { error: 'Ожидается JSON-тело запроса' }),
});
const removeSchema = z.object({ params: z.object({ type: typeField, id: idField }) });

/**
 * /favorites — избранное текущего пользователя (своё у каждого). Добавлять можно даже
 * с ролью viewer: это личная отметка, данные пространства она не меняет.
 */
export const favoritesRouter = Router();

favoritesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await favoritesService.listFavorites(req.user.id));
  }),
);

favoritesRouter.post(
  '/',
  validate(addSchema),
  asyncHandler(async (req, res) => {
    await favoritesService.addFavorite(req.user.id, req.validated.body);
    res.status(201).json({ ...req.validated.body, isFavorite: true });
  }),
);

favoritesRouter.delete(
  '/:type/:id',
  validate(removeSchema),
  asyncHandler(async (req, res) => {
    await favoritesService.removeFavorite(req.user.id, req.validated.params);
    res.status(204).end();
  }),
);
