import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../config/domain.js';

const body = (shape) => z.object(shape, { error: 'Ожидается JSON-тело запроса' });

// Пустая строка = «очистить» (null)
const emptyToNull = (value) => (typeof value === 'string' && value.trim() === '' ? null : value);
const nullable = (schema) => z.preprocess(emptyToNull, schema.nullable());

const fields = {
  title: z
    .string({ error: 'Введите название задачи' })
    .trim()
    .min(1, 'Введите название задачи')
    .max(200, 'Название — максимум 200 символов'),
  description: nullable(z.string().trim().max(10000, 'Описание — максимум 10000 символов')),
  status: z.enum(TASK_STATUSES, { error: `Статус: ${TASK_STATUSES.join(', ')}` }),
  priority: z.enum(TASK_PRIORITIES, { error: `Приоритет: ${TASK_PRIORITIES.join(', ')}` }),
  dueDate: nullable(z.iso.date({ error: 'Дата в формате ГГГГ-ММ-ДД' })),
  assigneeId: nullable(z.uuid({ error: 'Некорректный исполнитель' })),
};

export const createTaskSchema = z.object({
  body: body({
    title: fields.title,
    description: fields.description.optional(),
    status: fields.status.optional(),
    priority: fields.priority.optional(),
    dueDate: fields.dueDate.optional(),
    assigneeId: fields.assigneeId.optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: body({
    title: fields.title.optional(),
    description: fields.description.optional(),
    status: fields.status.optional(),
    priority: fields.priority.optional(),
    dueDate: fields.dueDate.optional(),
    assigneeId: fields.assigneeId.optional(),
  }).refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: 'Нечего обновлять: передайте хотя бы одно поле',
  }),
});

export const moveTaskSchema = z.object({
  body: body({
    status: fields.status,
    // Место в колонке ПОСЛЕ перемещения: 0 — наверх; больше длины колонки — в конец
    position: z
      .number({ error: 'position — номер места в колонке (0, 1, 2…)' })
      .int('position — целое число')
      .min(0, 'position — не меньше 0'),
  }),
});

/** «todo,in_progress» или ?status=todo&status=review → ['todo', 'in_progress'…] */
const listOf = (values, message) =>
  z.preprocess(
    (value) =>
      [value]
        .flat()
        .flatMap((item) => String(item).split(','))
        .filter(Boolean),
    z.array(z.enum(values, { error: message })).min(1),
  );

const statusFilter = listOf(TASK_STATUSES, 'Неизвестный статус').optional();
const priorityFilter = listOf(TASK_PRIORITIES, 'Неизвестный приоритет').optional();

export const listProjectTasksSchema = z.object({
  query: z.object({ status: statusFilter, priority: priorityFilter }),
});

const dateParam = z.iso.date({ error: 'Дата в формате ГГГГ-ММ-ДД' });

export const listWorkspaceTasksSchema = z.object({
  query: z
    .object({
      // Пока только «мои»; задел под assignee=<id> при совместной работе (этап 13)
      assignee: z.literal('me', { error: 'assignee: me' }).optional(),
      due_from: dateParam.optional(),
      due_to: dateParam.optional(),
      status: statusFilter,
      priority: priorityFilter,
      limit: z.coerce.number().int().min(1).max(500, 'limit — не больше 500').default(100),
      offset: z.coerce.number().int().min(0).default(0),
    })
    .refine((q) => !q.due_from || !q.due_to || q.due_from <= q.due_to, {
      error: 'due_from не может быть позже due_to',
      path: ['due_to'],
    }),
});
