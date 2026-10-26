import { daysUntil } from '@/lib/dates';

/** Группы страницы «Мои задачи» — в порядке показа. */
export const MY_TASK_GROUPS = [
  { key: 'overdue', label: 'Просрочено' },
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'На неделе' },
  { key: 'later', label: 'Позже' },
  { key: 'none', label: 'Без срока' },
  { key: 'done', label: 'Выполнено недавно' },
];

// Выполненные задачи показываем ещё неделю — чтобы галочка не «уносила» задачу в никуда
export const RECENT_DONE_DAYS = 7;

/** В какую группу попадает задача (null — не показываем: выполнена давно). */
export const myTaskGroup = (task, today = new Date()) => {
  if (task.status === 'done') {
    const completed = task.completedAt ? new Date(task.completedAt) : today;
    return today - completed <= RECENT_DONE_DAYS * 86_400_000 ? 'done' : null;
  }
  if (!task.dueDate) return 'none';
  const days = daysUntil(task.dueDate, today);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 7) return 'week';
  return 'later';
};

/**
 * Задачи → [{ key, label, tasks }] только с непустыми группами.
 * Порядок внутри группы — как пришёл с сервера (ближайший дедлайн, затем важность).
 */
export const groupMyTasks = (tasks = [], today = new Date()) => {
  const groups = new Map(MY_TASK_GROUPS.map((g) => [g.key, { ...g, tasks: [] }]));
  for (const task of tasks) {
    const key = myTaskGroup(task, today);
    if (key) groups.get(key).tasks.push(task);
  }
  return [...groups.values()].filter((g) => g.tasks.length > 0);
};
