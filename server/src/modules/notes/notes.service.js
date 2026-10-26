import { db } from '../../config/db.js';
import { assertLabelsInWorkspace } from '../labels/labels.service.js';
import { escapeLike, getProject } from '../projects/projects.service.js';

// Поля API (camelCase) → колонки БД (snake_case)
const COLUMNS = {
  title: 'title',
  content: 'content',
  isPinned: 'is_pinned',
  color: 'color',
  projectId: 'project_id',
};

const toColumns = (data) => {
  const row = {};
  for (const [field, column] of Object.entries(COLUMNS)) {
    if (data[field] !== undefined) row[column] = data[field];
  }
  return row;
};

const toNote = (row) => ({
  id: row.id,
  workspaceId: row.workspace_id,
  authorId: row.author_id,
  title: row.title,
  content: row.content,
  isPinned: row.is_pinned,
  color: row.color,
  project: row.project_id
    ? {
        id: row.project_id,
        title: row.project_title,
        type: row.project_type,
        archivedAt: row.project_archived_at,
      }
    : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Базовый запрос: заметка + краткие данные проекта. */
const notesQuery = (trx = db) =>
  trx('notes as n')
    .leftJoin('projects as p', 'p.id', 'n.project_id')
    .select(
      'n.*',
      'p.title as project_title',
      'p.type as project_type',
      'p.archived_at as project_archived_at',
    );

export const getNote = async (id, trx = db) =>
  toNote(await notesQuery(trx).where('n.id', id).first());

/** Заметки по списку id — в том же порядке (для «Избранного»). */
export const getNotesByIds = async (ids) => {
  if (ids.length === 0) return [];
  const byId = new Map((await notesQuery().whereIn('n.id', ids)).map((r) => [r.id, toNote(r)]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
};

/** Заметки пространства: закреплённые сверху, затем недавно изменённые. */
export const listNotes = async (workspaceId, { q, projectId, pinned, limit, offset }) => {
  const filtered = db('notes as n').where('n.workspace_id', workspaceId);
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    filtered.where((w) => w.whereILike('n.title', pattern).orWhereILike('n.content', pattern));
  }
  if (projectId === 'none') filtered.whereNull('n.project_id');
  else if (projectId) filtered.where('n.project_id', projectId);
  if (pinned !== undefined) filtered.where('n.is_pinned', pinned);

  const [{ total }, rows] = await Promise.all([
    filtered.clone().count({ total: '*' }).first(),
    filtered
      .clone()
      .leftJoin('projects as p', 'p.id', 'n.project_id')
      .select(
        'n.*',
        'p.title as project_title',
        'p.type as project_type',
        'p.archived_at as project_archived_at',
      )
      .orderBy([
        { column: 'n.is_pinned', order: 'desc' },
        { column: 'n.updated_at', order: 'desc' },
        { column: 'n.id' },
      ])
      .limit(limit)
      .offset(offset),
  ]);

  return { items: rows.map(toNote), total: Number(total), limit, offset };
};

// Привязать можно только к проекту своего пространства (чужой → 400 у поля)
const assertProject = (trx, projectId, workspaceId) =>
  assertLabelsInWorkspace(
    trx,
    'projects',
    [projectId],
    workspaceId,
    'projectId',
    'Проект не найден',
  );

export const createNote = (workspaceId, userId, data) =>
  db.transaction(async (trx) => {
    await assertProject(trx, data.projectId, workspaceId);
    const [row] = await trx('notes')
      .insert({ ...toColumns(data), workspace_id: workspaceId, author_id: userId })
      .returning('id');
    return getNote(row.id, trx);
  });

export const updateNote = (note, data) =>
  db.transaction(async (trx) => {
    if (data.projectId) await assertProject(trx, data.projectId, note.workspace_id);
    await trx('notes').where({ id: note.id }).update(toColumns(data));
    return getNote(note.id, trx);
  });

export const deleteNote = (note) => db('notes').where({ id: note.id }).del();

/**
 * Название проекта из идеи: заголовок, а если его нет — первая непустая строка текста
 * без Markdown-разметки в начале («# », «- », «> »).
 */
export const projectTitleFrom = (note) => {
  const firstLine = note.content
    .split('\n')
    .map((line) => line.replace(/^\s*(#{1,6}|[-*+>]|\d+\.)\s+/, '').trim())
    .find(Boolean);
  return (note.title.trim() || firstLine || 'Проект из идеи').slice(0, 120);
};

/**
 * «Превратить в проект» — одной транзакцией: создать проект (название и описание из заметки)
 * и привязать к нему заметку. Ошибка на любом шаге — не останется ни проекта, ни привязки.
 */
export const convertNote = (note, userId, { type }) =>
  db.transaction(async (trx) => {
    const [project] = await trx('projects')
      .insert({
        workspace_id: note.workspace_id,
        created_by: userId,
        title: projectTitleFrom(note),
        description: note.content.trim().slice(0, 5000) || null,
        type,
      })
      .returning('id');
    await trx('notes').where({ id: note.id }).update({ project_id: project.id });
    return { project: await getProject(project.id, trx), note: await getNote(note.id, trx) };
  });
