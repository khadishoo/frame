import { db } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { assertLabelsInWorkspace, toLabel } from '../labels/labels.service.js';

// Поля API (camelCase) → колонки БД (snake_case)
const COLUMNS = {
  title: 'title',
  description: 'description',
  type: 'type',
  status: 'status',
  visibility: 'visibility',
  color: 'color',
  categoryId: 'category_id',
  startDate: 'start_date',
  dueDate: 'due_date',
};

const toColumns = (data) => {
  const row = {};
  for (const [field, column] of Object.entries(COLUMNS)) {
    if (data[field] !== undefined) row[column] = data[field];
  }
  return row;
};

const toProject = (row, { tags = [], counts = { total: 0, done: 0 } } = {}) => ({
  id: row.id,
  workspaceId: row.workspace_id,
  title: row.title,
  description: row.description,
  type: row.type,
  status: row.status,
  visibility: row.visibility,
  color: row.color,
  coverUrl: row.cover_url,
  startDate: row.start_date,
  dueDate: row.due_date,
  archivedAt: row.archived_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  category: row.category_id
    ? { id: row.category_id, name: row.category_name, color: row.category_color }
    : null,
  tags,
  // Прогресс не хранится, а считается: выполненные / все задачи (PLAN 4.1)
  progress: counts.total ? Math.round((counts.done / counts.total) * 100) : 0,
  taskCounts: counts,
});

// ── Задачи (этап 7) ─────────────────────────────────────────────────────────
// Запрос уже готов; пока таблицы tasks нет, счётчики — нули.
let tasksTableExists;
const countTasks = async (projectIds) => {
  const counts = new Map();
  if (projectIds.length === 0) return counts;

  tasksTableExists ??= await db.schema.hasTable('tasks');
  if (!tasksTableExists) return counts;

  const rows = await db('tasks')
    .whereIn('project_id', projectIds)
    .groupBy('project_id')
    .select('project_id')
    .count({ total: '*' })
    .select(db.raw("count(*) filter (where status = 'done') as done"));
  for (const row of rows) {
    counts.set(row.project_id, { total: Number(row.total), done: Number(row.done) });
  }
  return counts;
};

/** Теги для набора проектов — одним запросом (без N+1). */
const loadTags = async (projectIds, trx = db) => {
  const tags = new Map(projectIds.map((id) => [id, []]));
  if (projectIds.length === 0) return tags;

  const rows = await trx('project_tags as pt')
    .join('tags as t', 't.id', 'pt.tag_id')
    .whereIn('pt.project_id', projectIds)
    .select('pt.project_id', 't.id', 't.name', 't.color')
    .orderBy('t.name');
  for (const row of rows) tags.get(row.project_id).push(toLabel(row));
  return tags;
};

/** Строки проектов → ответ API с категорией, тегами и счётчиками задач. */
const withRelations = async (rows, trx = db) => {
  const ids = rows.map((row) => row.id);
  const [tags, counts] = await Promise.all([loadTags(ids, trx), countTasks(ids)]);
  return rows.map((row) =>
    toProject(row, { tags: tags.get(row.id), counts: counts.get(row.id) ?? { total: 0, done: 0 } }),
  );
};

/** Базовый запрос: проект + поля категории. */
const projectsQuery = (trx = db) =>
  trx('projects as p')
    .leftJoin('categories as c', 'c.id', 'p.category_id')
    .select('p.*', 'c.name as category_name', 'c.color as category_color');

export const getProject = async (id, trx = db) => {
  const row = await projectsQuery(trx).where('p.id', id).first();
  const [project] = await withRelations([row], trx);
  return project;
};

// Экранируем % и _ — иначе «50%» в поиске значило бы «50 и что угодно»
const escapeLike = (value) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

const SORTS = {
  updated_at: { column: 'p.updated_at', defaultOrder: 'desc' },
  due_date: { column: 'p.due_date', defaultOrder: 'asc' },
  title: { column: 'p.title', defaultOrder: 'asc' },
};

/** Список проектов пространства: фильтры, сортировка, пагинация + total. */
export const listProjects = async (workspaceId, query) => {
  const { status, type, category, tag, q, sort, order, limit, offset } = query;

  const filtered = db('projects as p').where('p.workspace_id', workspaceId);

  if (status === 'archived') {
    filtered.whereNotNull('p.archived_at');
  } else {
    filtered.whereNull('p.archived_at');
    if (status) filtered.where('p.status', status);
  }
  if (type) filtered.where('p.type', type);
  if (category === 'none') filtered.whereNull('p.category_id');
  else if (category) filtered.where('p.category_id', category);
  if (tag) {
    filtered.whereExists(
      db('project_tags as pt')
        .select(db.raw('1'))
        .whereRaw('pt.project_id = p.id')
        .where('pt.tag_id', tag),
    );
  }
  if (q) filtered.whereILike('p.title', `%${escapeLike(q)}%`);

  const { column, defaultOrder } = SORTS[sort];
  const direction = order ?? defaultOrder;

  const [{ total }, rows] = await Promise.all([
    filtered.clone().count({ total: '*' }).first(),
    filtered
      .clone()
      .leftJoin('categories as c', 'c.id', 'p.category_id')
      .select('p.*', 'c.name as category_name', 'c.color as category_color')
      // Проекты без дедлайна — в конце при любом направлении
      .orderByRaw(`${column} ${direction} nulls last`)
      .orderBy('p.id') // стабильный порядок для пагинации
      .limit(limit)
      .offset(offset),
  ]);

  return { items: await withRelations(rows), total: Number(total), limit, offset };
};

// Нарушение CHECK по датам (дедлайн раньше начала с учётом уже сохранённой даты)
const mapDbErrors = (err) => {
  if (err.code === '23514' && err.constraint === 'projects_dates_check') {
    const message = 'Дедлайн не может быть раньше даты начала';
    return new AppError(400, 'VALIDATION_ERROR', message, [{ path: 'body.dueDate', message }]);
  }
  return err;
};

const replaceTags = async (trx, projectId, tagIds) => {
  await trx('project_tags').where({ project_id: projectId }).del();
  if (tagIds.length > 0) {
    await trx('project_tags').insert(
      tagIds.map((tagId) => ({ project_id: projectId, tag_id: tagId })),
    );
  }
};

const assertCategory = (trx, categoryId, workspaceId) =>
  assertLabelsInWorkspace(
    trx,
    'categories',
    [categoryId],
    workspaceId,
    'categoryId',
    'Категория не найдена',
  );

const assertTags = (trx, tagIds, workspaceId) =>
  assertLabelsInWorkspace(trx, 'tags', tagIds, workspaceId, 'tagIds', 'Тег не найден');

export const createProject = async (workspaceId, userId, { tagIds = [], ...data }) =>
  db
    .transaction(async (trx) => {
      await assertCategory(trx, data.categoryId, workspaceId);
      await assertTags(trx, tagIds, workspaceId);

      const [row] = await trx('projects')
        .insert({ ...toColumns(data), workspace_id: workspaceId, created_by: userId })
        .returning('id');
      await replaceTags(trx, row.id, tagIds);
      return getProject(row.id, trx);
    })
    .catch((err) => {
      throw mapDbErrors(err);
    });

export const updateProject = async (project, data) =>
  db
    .transaction(async (trx) => {
      if (data.categoryId) await assertCategory(trx, data.categoryId, project.workspace_id);
      await trx('projects').where({ id: project.id }).update(toColumns(data));
      return getProject(project.id, trx);
    })
    .catch((err) => {
      throw mapDbErrors(err);
    });

/** Заменить набор тегов проекта целиком — в одной транзакции. */
export const setProjectTags = (project, tagIds) =>
  db.transaction(async (trx) => {
    await assertTags(trx, tagIds, project.workspace_id);
    await replaceTags(trx, project.id, tagIds);
    // Смена тегов — тоже изменение проекта (сортировка «недавно изменённые»)
    await trx('projects').where({ id: project.id }).update({ updated_at: trx.fn.now() });
    return getProject(project.id, trx);
  });

export const setArchived = async (project, archived) => {
  await db('projects')
    .where({ id: project.id })
    .update({ archived_at: archived ? db.fn.now() : null });
  return getProject(project.id);
};

export const deleteProject = (project) => db('projects').where({ id: project.id }).del();
