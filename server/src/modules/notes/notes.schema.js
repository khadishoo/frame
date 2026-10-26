import { z } from 'zod';
import { LABEL_COLORS, PROJECT_TYPES } from '../../config/domain.js';

const body = (shape) => z.object(shape, { error: 'Ожидается JSON-тело запроса' });

const emptyToNull = (value) => (typeof value === 'string' && value.trim() === '' ? null : value);
const nullable = (schema) => z.preprocess(emptyToNull, schema.nullable());

const fields = {
  title: z
    .string({ error: 'Заголовок — строка' })
    .trim()
    .max(200, 'Заголовок — максимум 200 символов'),
  // Текст не обрезаем по краям: в Markdown важны отступы и пустые строки
  content: z.string({ error: 'Текст — строка' }).max(50000, 'Текст — максимум 50 000 символов'),
  isPinned: z.boolean({ error: 'isPinned: true или false' }),
  color: nullable(z.enum(LABEL_COLORS, { error: `Цвет: ${LABEL_COLORS.join(', ')}` })),
  projectId: nullable(z.uuid({ error: 'Некорректный проект' })),
};

export const createNoteSchema = z.object({
  body: body({
    title: fields.title.default(''),
    content: fields.content.default(''),
    isPinned: fields.isPinned.optional(),
    color: fields.color.optional(),
    projectId: fields.projectId.optional(),
  }).refine((data) => data.title || data.content.trim(), {
    error: 'Напишите заголовок или текст идеи',
    path: ['title'],
  }),
});

export const updateNoteSchema = z.object({
  body: body({
    title: fields.title.optional(),
    content: fields.content.optional(),
    isPinned: fields.isPinned.optional(),
    color: fields.color.optional(),
    projectId: fields.projectId.optional(),
  }).refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: 'Нечего обновлять: передайте хотя бы одно поле',
  }),
});

export const listNotesSchema = z.object({
  query: z.object({
    q: z.string().trim().max(100, 'Слишком длинный запрос').optional(),
    // none — заметки без проекта
    projectId: z.union([z.literal('none'), z.uuid()], { error: 'Некорректный проект' }).optional(),
    pinned: z
      .enum(['true', 'false'], { error: 'pinned: true или false' })
      .transform((value) => value === 'true')
      .optional(),
    limit: z.coerce.number().int().min(1).max(200, 'limit — не больше 200').default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

// Тело можно не передавать: тогда проект получит тип «Другое»
export const convertNoteSchema = z.object({
  body: z
    .object({ type: z.enum(PROJECT_TYPES, { error: 'Выберите творческий тип' }).default('other') })
    .default({ type: 'other' }),
});
