import { db } from '../../config/db.js';
import { getMembership } from '../../middleware/access.js';
import { AppError } from '../../utils/AppError.js';

// Шаг между соседними карточками и минимальный промежуток, после которого колонку
// перенумеровываем (среднее соседей делит промежуток пополам — он быстро тает)
export const POSITION_STEP = 1000;
export const MIN_POSITION_GAP = 0.001;

// Поля API (camelCase) → колонки БД (snake_case)
const COLUMNS = {
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'due_date',
  assigneeId: 'assignee_id',
};

const toColumns = (data) => {
  const row = {};
  for (const [field, column] of Object.entries(COLUMNS)) {
    if (data[field] !== undefined) row[column] = data[field];
  }
  return row;
};

const toTask = (row) => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  dueDate: row.due_date,
  position: row.position,
  completedAt: row.completed_at,
  createdBy: row.created_by,
  assignee: row.assignee_id
    ? {
        id: row.assignee_id,
        name: row.assignee_name,
        username: row.assignee_username,
        avatarUrl: row.assignee_avatar_url,
      }
    : null,
  // Только в списке «Мои задачи»: задачи там из разных проектов
  ...(row.project_title !== undefined && {
    project: {
      id: row.project_id,
      title: row.project_title,
      type: row.project_type,
      color: row.project_color,
    },
  }),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Базовый запрос: задача + краткие данные исполнителя. */
const tasksQuery = (trx = db) =>
  trx('tasks as t')
    .leftJoin('users as u', 'u.id', 't.assignee_id')
    .select(
      't.*',
      'u.name as assignee_name',
      'u.username as assignee_username',
      'u.avatar_url as assignee_avatar_url',
    );

export const getTask = async (id, trx = db) =>
  toTask(await tasksQuery(trx).where('t.id', id).first());

/** Задачи проекта для доски: по колонкам (порядок enum), внутри — по position. */
export const listProjectTasks = async (projectId, { status, priority }) => {
  const query = tasksQuery().where('t.project_id', projectId);
  if (status) query.whereIn('t.status', status);
  if (priority) query.whereIn('t.priority', priority);
  const rows = await query.orderBy([
    { column: 't.status' },
    { column: 't.position' },
    { column: 't.id' },
  ]);
  return { items: rows.map(toTask) };
};

/**
 * Задачи всего пространства — для «Моих задач» и календаря. Задачи архивных проектов не
 * показываем. Сначала ближайшие дедлайны (без дедлайна — в конце), затем важные.
 */
export const listWorkspaceTasks = async (workspaceId, userId, query) => {
  const { assignee, due_from: dueFrom, due_to: dueTo, status, priority, limit, offset } = query;

  const filtered = db('tasks as t')
    .join('projects as p', 'p.id', 't.project_id')
    .where('p.workspace_id', workspaceId)
    .whereNull('p.archived_at');
  if (assignee === 'me') filtered.where('t.assignee_id', userId);
  if (dueFrom) filtered.where('t.due_date', '>=', dueFrom);
  if (dueTo) filtered.where('t.due_date', '<=', dueTo);
  if (status) filtered.whereIn('t.status', status);
  if (priority) filtered.whereIn('t.priority', priority);

  const [{ total }, rows] = await Promise.all([
    filtered.clone().count({ total: '*' }).first(),
    filtered
      .clone()
      .leftJoin('users as u', 'u.id', 't.assignee_id')
      .select(
        't.*',
        'u.name as assignee_name',
        'u.username as assignee_username',
        'u.avatar_url as assignee_avatar_url',
        'p.title as project_title',
        'p.type as project_type',
        'p.color as project_color',
      )
      .orderByRaw('t.due_date asc nulls last')
      .orderBy('t.priority', 'desc') // enum: low < medium < high < urgent
      .orderBy('t.id')
      .limit(limit)
      .offset(offset),
  ]);

  return { items: rows.map(toTask), total: Number(total), limit, offset };
};

// ── Проверки ────────────────────────────────────────────────────────────────

/**
 * Блокирует строку проекта до конца транзакции (SELECT … FOR UPDATE): все изменения задач
 * одного проекта идут по очереди, и два одновременных перемещения не посчитают позиции
 * по устаревшим данным. Заодно проверяем архив — уже под блокировкой, без гонки.
 */
const lockProject = async (trx, projectId) => {
  const project = await trx('projects')
    .where({ id: projectId })
    .forUpdate()
    .first('id', 'workspace_id', 'archived_at');
  if (project.archived_at) {
    throw new AppError(
      409,
      'PROJECT_ARCHIVED',
      'Проект в архиве: восстановите его, чтобы менять задачи',
    );
  }
  return project;
};

/** Исполнитель — только участник того же пространства (иначе 400 у поля). */
const assertAssignee = async (trx, assigneeId, workspaceId) => {
  if (!assigneeId) return;
  if (!(await getMembership(workspaceId, assigneeId, trx))) {
    const message = 'Исполнитель должен быть участником пространства';
    throw new AppError(400, 'VALIDATION_ERROR', message, [{ path: 'body.assigneeId', message }]);
  }
};

/** Переход в done ставит время выполнения, уход из done — очищает; иначе поле не трогаем. */
const withCompletedAt = (trx, changes, fromStatus, toStatus) => {
  if (toStatus === 'done' && fromStatus !== 'done')
    return { ...changes, completed_at: trx.fn.now() };
  if (fromStatus === 'done' && toStatus !== 'done') return { ...changes, completed_at: null };
  return changes;
};

// ── Позиции ─────────────────────────────────────────────────────────────────

/** Позиция в конце колонки: последняя + шаг. */
const endOfColumn = async (trx, projectId, status) => {
  const { max } = await trx('tasks')
    .where({ project_id: projectId, status })
    .max({ max: 'position' })
    .first();
  return max === null ? POSITION_STEP : max + POSITION_STEP;
};

/** Колонка без перемещаемой задачи — по порядку. */
const columnWithout = (trx, projectId, status, taskId) =>
  trx('tasks')
    .where({ project_id: projectId, status })
    .whereNot({ id: taskId })
    .orderBy([{ column: 'position' }, { column: 'id' }])
    .select('id', 'position');

/**
 * Позиция для места index между соседями: среднее; с краю — сосед ± шаг.
 * null — соседи слишком близко, нужна перенумерация.
 */
const positionAt = (column, index) => {
  const before = column[index - 1]?.position;
  const after = column[index]?.position;
  if (before === undefined && after === undefined) return POSITION_STEP;
  if (before === undefined) return after - POSITION_STEP;
  if (after === undefined) return before + POSITION_STEP;
  if (after - before < MIN_POSITION_GAP) return null;
  return (before + after) / 2;
};

/** Перенумеровать колонку: 1000, 2000, 3000… в текущем порядке — одним запросом. */
const renumberColumn = (trx, projectId, status, taskId) =>
  trx.raw(
    `UPDATE tasks AS t SET position = s.rn * ?
     FROM (
       SELECT id, row_number() OVER (ORDER BY position, id) AS rn
       FROM tasks WHERE project_id = ? AND status = ? AND id <> ?
     ) AS s
     WHERE t.id = s.id`,
    [POSITION_STEP, projectId, status, taskId],
  );

// ── Изменения ───────────────────────────────────────────────────────────────

/**
 * Новая задача — в конец своей колонки. Исполнитель не передан — назначаем автора
 * (явный null или '' — «без исполнителя»).
 */
export const createTask = (project, userId, { assigneeId = userId, ...rest }) =>
  db.transaction(async (trx) => {
    const data = { ...rest, assigneeId };
    await lockProject(trx, project.id);
    await assertAssignee(trx, data.assigneeId, project.workspace_id);

    const status = data.status ?? 'todo';
    const [row] = await trx('tasks')
      .insert({
        ...toColumns(data),
        project_id: project.id,
        created_by: userId,
        status,
        position: await endOfColumn(trx, project.id, status),
        completed_at: status === 'done' ? trx.fn.now() : null,
      })
      .returning('id');
    return getTask(row.id, trx);
  });

/** Смена полей. Смена статуса здесь (не перетаскиванием) — задача уходит в конец колонки. */
export const updateTask = (task, data) =>
  db.transaction(async (trx) => {
    const project = await lockProject(trx, task.project_id);
    await assertAssignee(trx, data.assigneeId, project.workspace_id);

    let changes = toColumns(data);
    if (data.status && data.status !== task.status) {
      changes.position = await endOfColumn(trx, task.project_id, data.status);
      changes = withCompletedAt(trx, changes, task.status, data.status);
    }
    await trx('tasks').where({ id: task.id }).update(changes);
    return getTask(task.id, trx);
  });

/**
 * Перетаскивание: колонка status, место position (0 — наверх). Всё в одной транзакции:
 * прочитать соседей → посчитать позицию → при нужде перенумеровать колонку → сохранить.
 */
export const moveTask = (task, { status, position: index }) =>
  db.transaction(async (trx) => {
    await lockProject(trx, task.project_id);

    let column = await columnWithout(trx, task.project_id, status, task.id);
    const target = Math.min(index, column.length);
    let position = positionAt(column, target);
    if (position === null) {
      await renumberColumn(trx, task.project_id, status, task.id);
      column = await columnWithout(trx, task.project_id, status, task.id);
      position = positionAt(column, target);
    }

    await trx('tasks')
      .where({ id: task.id })
      .update(withCompletedAt(trx, { status, position }, task.status, status));
    return getTask(task.id, trx);
  });

export const deleteTask = (task) =>
  db.transaction(async (trx) => {
    await lockProject(trx, task.project_id);
    await trx('tasks').where({ id: task.id }).del();
  });
