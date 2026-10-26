/**
 * Статусы (колонки доски) и приоритеты задач — как TASK_STATUSES/TASK_PRIORITIES на сервере.
 * Цвета приоритетов — из палитры меток (пары оттенков для обеих тем), как у категорий и тегов.
 */
export const TASK_STATUSES = {
  todo: { label: 'К работе', dot: 'bg-muted' },
  in_progress: { label: 'В процессе', dot: 'bg-type-video' },
  review: { label: 'На проверке', dot: 'bg-warning' },
  done: { label: 'Готово', dot: 'bg-success' },
};

export const TASK_STATUS_KEYS = Object.keys(TASK_STATUSES);

export const TASK_PRIORITIES = {
  low: { label: 'Низкий', chip: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300', rank: 0 },
  medium: { label: 'Средний', chip: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', rank: 1 },
  high: { label: 'Высокий', chip: 'bg-amber-500/10 text-amber-800 dark:text-amber-300', rank: 2 },
  urgent: { label: 'Срочно', chip: 'bg-red-500/10 text-red-700 dark:text-red-300', rank: 3 },
};

export const TASK_PRIORITY_KEYS = Object.keys(TASK_PRIORITIES);

export const taskStatusOptions = TASK_STATUS_KEYS.map((value) => ({
  value,
  label: TASK_STATUSES[value].label,
}));

export const taskPriorityOptions = TASK_PRIORITY_KEYS.map((value) => ({
  value,
  label: TASK_PRIORITIES[value].label,
}));
