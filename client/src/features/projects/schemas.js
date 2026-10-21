import { z } from 'zod';
import { PROJECT_STATUS_KEYS } from '@/lib/projectStatuses';
import { PROJECT_TYPE_KEYS } from '@/lib/projectTypes';

// Те же правила, что на сервере (server/src/modules/projects/projects.schema.js)
export const projectFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Введите название')
      .max(120, 'Название — максимум 120 символов'),
    description: z.string().max(5000, 'Описание — максимум 5000 символов'),
    type: z.enum(PROJECT_TYPE_KEYS, { error: 'Выберите творческий тип' }),
    status: z.enum(PROJECT_STATUS_KEYS),
    categoryId: z.string(), // '' — без категории
    tagIds: z.array(z.string()).max(20, 'Не больше 20 тегов'),
    startDate: z.string(), // '' или YYYY-MM-DD (input type=date)
    dueDate: z.string(),
  })
  .refine((data) => !data.startDate || !data.dueDate || data.dueDate >= data.startDate, {
    message: 'Дедлайн не может быть раньше даты начала',
    path: ['dueDate'],
  });

export const emptyProjectForm = {
  title: '',
  description: '',
  type: undefined,
  status: 'active',
  categoryId: '',
  tagIds: [],
  startDate: '',
  dueDate: '',
};

/** Проект из API → значения формы (null → ''). */
export const toFormValues = (project) => ({
  title: project.title,
  description: project.description ?? '',
  type: project.type,
  status: project.status,
  categoryId: project.category?.id ?? '',
  tagIds: project.tags.map((t) => t.id),
  startDate: project.startDate ?? '',
  dueDate: project.dueDate ?? '',
});

/** Значения формы → тело запроса ('' → null). Теги отправляются отдельно. */
export const toPayload = (values) => ({
  title: values.title.trim(),
  description: values.description.trim() || null,
  type: values.type,
  status: values.status,
  categoryId: values.categoryId || null,
  startDate: values.startDate || null,
  dueDate: values.dueDate || null,
});
