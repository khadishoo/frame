import { Router } from 'express';
import { loadRecord, requireRole } from '../../middleware/access.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createLabelController } from './labels.controller.js';
import { createLabelSchema, updateLabelSchema } from './labels.schema.js';
import { createLabelService } from './labels.service.js';

/**
 * Собирает два роутера для меток одного вида (категорий или тегов):
 * - collection: /workspaces/:wsId/<name> — GET список, POST создать (после loadWorkspace);
 * - item: /<name>/:id — PATCH, DELETE (сам проверяет доступ к записи).
 * Читать могут все участники, менять — member и выше.
 */
const createLabelRouters = ({ table, notFoundMessage, duplicateCode, duplicateMessage }) => {
  const controller = createLabelController(
    createLabelService({ table, duplicateCode, duplicateMessage }),
  );

  const collection = Router({ mergeParams: true });
  collection.get('/', asyncHandler(controller.list));
  collection.post(
    '/',
    requireRole('member'),
    validate(createLabelSchema),
    asyncHandler(controller.create),
  );

  const item = Router();
  item.use('/:id', loadRecord(table, notFoundMessage));
  item.patch(
    '/:id',
    requireRole('member'),
    validate(updateLabelSchema),
    asyncHandler(controller.update),
  );
  item.delete('/:id', requireRole('member'), asyncHandler(controller.remove));

  return { collection, item };
};

export const categoryRouters = createLabelRouters({
  table: 'categories',
  notFoundMessage: 'Категория не найдена',
  duplicateCode: 'CATEGORY_EXISTS',
  duplicateMessage: 'Категория с таким названием уже есть',
});

export const tagRouters = createLabelRouters({
  table: 'tags',
  notFoundMessage: 'Тег не найден',
  duplicateCode: 'TAG_EXISTS',
  duplicateMessage: 'Тег с таким названием уже есть',
});
