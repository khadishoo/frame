/**
 * Значения предметной области — общие для схем Zod, сервисов и сидов.
 * Совпадают с enum/CHECK в миграциях; меняются только вместе с новой миграцией.
 */

export const PROJECT_TYPES = ['art', 'music', 'video', 'photo', 'script', 'dev', 'other'];

// Рабочее состояние проекта; архив — отдельно, полем archived_at
export const PROJECT_STATUSES = ['idea', 'active', 'paused', 'completed'];

// Колонки доски задач — в порядке слева направо
export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Что можно добавить в избранное
export const FAVORITE_TYPES = ['project', 'note'];

export const VISIBILITIES = ['private', 'workspace', 'public'];

// Палитра категорий, тегов и проектов (клиент подбирает оттенок под тему)
export const LABEL_COLORS = [
  'gray',
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'blue',
  'violet',
  'pink',
];

// Роли в пространстве — от старшей к младшей
export const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'viewer'];

export const DEFAULT_CATEGORIES = [
  { name: 'Для себя', color: 'violet' },
  { name: 'Работа', color: 'blue' },
  { name: 'Заказы', color: 'amber' },
  { name: 'Учёба', color: 'green' },
];
