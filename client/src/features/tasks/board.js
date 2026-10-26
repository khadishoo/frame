import { TASK_STATUS_KEYS } from '@/lib/taskMeta';

/**
 * Чистая логика доски — без React, поэтому её легко тестировать.
 * Порядок в колонке задаёт position (шаг 1000, вставка — среднее соседей), как на сервере.
 * Во время перетаскивания доска — это { status: [id, id…] }.
 */

export const POSITION_STEP = 1000;

export const byPosition = (a, b) => a.position - b.position || (a.id < b.id ? -1 : 1);

/** Задачи → { todo: [task…], in_progress: […], … } по порядку. */
export const groupByStatus = (tasks = []) => {
  const columns = Object.fromEntries(TASK_STATUS_KEYS.map((status) => [status, []]));
  for (const task of tasks) columns[task.status]?.push(task);
  for (const status of TASK_STATUS_KEYS) columns[status].sort(byPosition);
  return columns;
};

/** { status: [task…] } → { status: [id…] } */
export const toIds = (columns) =>
  Object.fromEntries(
    Object.entries(columns).map(([status, tasks]) => [status, tasks.map((t) => t.id)]),
  );

/**
 * Позиция для места index в колонке (column — без перемещаемой задачи):
 * между соседями — среднее, с краю — сосед ± шаг, в пустой колонке — первый шаг.
 * Слишком маленький промежуток сервер перенумерует сам — клиенту важен только порядок.
 */
export const positionAt = (column, index) => {
  const before = column[index - 1]?.position;
  const after = column[index]?.position;
  if (before === undefined && after === undefined) return POSITION_STEP;
  if (before === undefined) return after - POSITION_STEP;
  if (after === undefined) return before + POSITION_STEP;
  return (before + after) / 2;
};

/** Позиция в конце колонки. */
export const endOfColumn = (tasks, status) => {
  const positions = tasks.filter((t) => t.status === status).map((t) => t.position);
  return positions.length ? Math.max(...positions) + POSITION_STEP : POSITION_STEP;
};

/** Переход в done ставит время выполнения, уход из done — очищает (как на сервере). */
export const withCompletedAt = (task, fromStatus, now = new Date().toISOString()) => {
  if (task.status === 'done' && fromStatus !== 'done') return { ...task, completedAt: now };
  if (fromStatus === 'done' && task.status !== 'done') return { ...task, completedAt: null };
  return task;
};

/** Список задач после перемещения { id, status, index } — для оптимистичного обновления. */
export const applyMove = (tasks, { id, status, index }) => {
  const task = tasks.find((t) => t.id === id);
  if (!task) return tasks;
  const column = tasks.filter((t) => t.status === status && t.id !== id).sort(byPosition);
  const position = positionAt(column, Math.min(index, column.length));
  const moved = withCompletedAt({ ...task, status, position }, task.status);
  return tasks.map((t) => (t.id === id ? moved : t));
};

/**
 * Задача после PATCH-изменения data — для оптимистичного обновления.
 * Смена статуса (не перетаскиванием) ставит задачу в конец колонки — как сервер.
 */
export const patchTask = (task, data, { siblings = [], me } = {}) => {
  const next = { ...task };
  for (const field of ['title', 'description', 'priority', 'dueDate']) {
    if (data[field] !== undefined) next[field] = data[field];
  }
  if (data.assigneeId !== undefined) {
    if (!data.assigneeId) next.assignee = null;
    else if (data.assigneeId === me?.id) next.assignee = me;
    else if (data.assigneeId !== task.assignee?.id)
      next.assignee = { id: data.assigneeId, name: '' };
  }
  if (data.status && data.status !== task.status) {
    next.status = data.status;
    next.position = endOfColumn(siblings, data.status);
    return withCompletedAt(next, task.status);
  }
  return next;
};

// ── Во время перетаскивания ─────────────────────────────────────────────────

/** В какой колонке id (id может быть и самой колонкой — пустая колонка тоже цель). */
export const findColumn = (columns, id) =>
  id in columns ? id : Object.keys(columns).find((status) => columns[status].includes(id));

/**
 * Карточку протащили над другой колонкой: переносим её туда — на место карточки,
 * над которой курсор, или в конец, если курсор над самой колонкой.
 */
export const moveAcross = (columns, activeId, overId) => {
  const from = findColumn(columns, activeId);
  const to = findColumn(columns, overId);
  if (!from || !to || from === to) return columns;

  const target = columns[to].filter((id) => id !== activeId);
  const overIndex = target.indexOf(overId);
  target.splice(overIndex === -1 ? target.length : overIndex, 0, activeId);
  return { ...columns, [from]: columns[from].filter((id) => id !== activeId), [to]: target };
};

/** Перестановка внутри колонки: карточка встаёт на место той, над которой её отпустили. */
export const reorderWithin = (columns, activeId, overId) => {
  const status = findColumn(columns, activeId);
  if (!status || findColumn(columns, overId) !== status || overId === status) return columns;
  const ids = columns[status];
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === to) return columns;
  const next = ids.filter((id) => id !== activeId);
  next.splice(to, 0, activeId);
  return { ...columns, [status]: next };
};

/** Где карточка сейчас: { status, index } или null. */
export const locate = (columns, id) => {
  const status = findColumn(columns, id);
  return status ? { status, index: columns[status].indexOf(id) } : null;
};
