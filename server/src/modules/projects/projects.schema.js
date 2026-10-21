import { z } from 'zod';
import {
  LABEL_COLORS,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  VISIBILITIES,
} from '../../config/domain.js';

const body = (shape) => z.object(shape, { error: 'Ожидается JSON-тело запроса' });

// Пустая строка = «очистить» (null)
const emptyToNull = (value) => (typeof value === 'string' && value.trim() === '' ? null : value);
const nullable = (schema) => z.preprocess(emptyToNull, schema.nullable());

const fields = {
  title: z
    .string({ error: 'Введите название' })
    .trim()
    .min(1, 'Введите название')
    .max(120, 'Название — максимум 120 символов'),
  description: nullable(z.string().trim().max(5000, 'Описание — максимум 5000 символов')),
  type: z.enum(PROJECT_TYPES, { error: 'Выберите творческий тип' }),
  status: z.enum(PROJECT_STATUSES, { error: `Статус: ${PROJECT_STATUSES.join(', ')}` }),
  visibility: z.enum(VISIBILITIES, { error: `Видимость: ${VISIBILITIES.join(', ')}` }),
  color: nullable(z.enum(LABEL_COLORS, { error: `Цвет: ${LABEL_COLORS.join(', ')}` })),
  categoryId: nullable(z.uuid({ error: 'Некорректная категория' })),
  startDate: nullable(z.iso.date({ error: 'Дата в формате ГГГГ-ММ-ДД' })),
  dueDate: nullable(z.iso.date({ error: 'Дата в формате ГГГГ-ММ-ДД' })),
};

const tagIds = z
  .array(z.uuid({ error: 'Некорректный тег' }), { error: 'Ожидается список тегов' })
  .max(20, 'Не больше 20 тегов на проект')
  .transform((ids) => [...new Set(ids)]);

// Дедлайн не раньше даты начала (если указаны обе)
const datesInOrder = (data) => !data.startDate || !data.dueDate || data.dueDate >= data.startDate;
const datesError = { error: 'Дедлайн не может быть раньше даты начала', path: ['dueDate'] };

export const createProjectSchema = z.object({
  body: body({
    title: fields.title,
    type: fields.type,
    description: fields.description.optional(),
    status: fields.status.optional(),
    visibility: fields.visibility.optional(),
    color: fields.color.optional(),
    categoryId: fields.categoryId.optional(),
    tagIds: tagIds.optional(),
    startDate: fields.startDate.optional(),
    dueDate: fields.dueDate.optional(),
  }).refine(datesInOrder, datesError),
});

export const updateProjectSchema = z.object({
  body: body({
    title: fields.title.optional(),
    type: fields.type.optional(),
    description: fields.description.optional(),
    status: fields.status.optional(),
    visibility: fields.visibility.optional(),
    color: fields.color.optional(),
    categoryId: fields.categoryId.optional(),
    startDate: fields.startDate.optional(),
    dueDate: fields.dueDate.optional(),
  })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
      error: 'Нечего обновлять: передайте хотя бы одно поле',
    })
    .refine(datesInOrder, datesError),
});

export const setTagsSchema = z.object({
  body: body({ tagIds }),
});

export const SORT_FIELDS = ['updated_at', 'due_date', 'title'];

export const listProjectsSchema = z.object({
  query: z.object({
    // archived — только архив; без status — все неархивные
    status: z.enum([...PROJECT_STATUSES, 'archived'], { error: 'Неизвестный статус' }).optional(),
    type: z.enum(PROJECT_TYPES, { error: 'Неизвестный тип' }).optional(),
    // none — проекты без категории
    category: z
      .union([z.literal('none'), z.uuid()], { error: 'Некорректная категория' })
      .optional(),
    tag: z.uuid({ error: 'Некорректный тег' }).optional(),
    q: z.string().trim().max(100, 'Слишком длинный запрос').optional(),
    sort: z
      .enum(SORT_FIELDS, { error: `Сортировка: ${SORT_FIELDS.join(', ')}` })
      .default('updated_at'),
    order: z.enum(['asc', 'desc'], { error: 'Порядок: asc или desc' }).optional(),
    limit: z.coerce.number().int().min(1).max(100, 'limit — не больше 100').default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});
