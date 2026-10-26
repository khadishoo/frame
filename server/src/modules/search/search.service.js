import { db } from '../../config/db.js';
import { escapeLike } from '../projects/projects.service.js';

export const SEARCH_LIMIT = 5;
const SNIPPET_RADIUS = 40;

/**
 * Кусочек текста вокруг первого совпадения: «…начало совпадение конец…».
 * null — в тексте совпадения нет (нашлось в названии).
 */
export const snippetAround = (text, q) => {
  if (!text) return null;
  const flat = text.replace(/\s+/g, ' ').trim();
  const index = flat.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return null;
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(flat.length, index + q.length + SNIPPET_RADIUS);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end).trim()}${end < flat.length ? '…' : ''}`;
};

/**
 * Простой поиск ILIKE — по 5 результатов на тип. Порядок: сначала название, которое
 * начинается с запроса, потом совпадение в названии, потом в тексте; внутри — свежие.
 * % и _ экранированы: «50%» ищет «50%», а не «50 и что угодно».
 * Полнотекстовый поиск (tsvector) — в версии 1.3.
 */
export const search = async (workspaceId, q) => {
  const contains = `%${escapeLike(q)}%`;
  const prefix = `${escapeLike(q)}%`;
  // Ранг совпадения: 0 — название начинается с запроса, 1 — содержит, 2 — только в тексте
  const rank = (column) =>
    db.raw(`CASE WHEN ${column} ILIKE ? THEN 0 WHEN ${column} ILIKE ? THEN 1 ELSE 2 END`, [
      prefix,
      contains,
    ]);

  const [projects, tasks, notes] = await Promise.all([
    db('projects as p')
      .where('p.workspace_id', workspaceId)
      .whereNull('p.archived_at')
      .where((w) => w.whereILike('p.title', contains).orWhereILike('p.description', contains))
      .select('p.id', 'p.title', 'p.type', 'p.status', 'p.description')
      .orderBy([{ column: rank('p.title') }, { column: 'p.updated_at', order: 'desc' }])
      .limit(SEARCH_LIMIT),
    db('tasks as t')
      .join('projects as p', 'p.id', 't.project_id')
      .where('p.workspace_id', workspaceId)
      .whereNull('p.archived_at')
      .whereILike('t.title', contains)
      .select(
        't.id',
        't.title',
        't.status',
        't.due_date',
        'p.id as project_id',
        'p.title as project_title',
        'p.type as project_type',
      )
      // Невыполненные — выше: их ищут, чтобы сделать
      .orderBy([
        { column: rank('t.title') },
        { column: db.raw("(t.status = 'done')") },
        { column: 't.updated_at', order: 'desc' },
      ])
      .limit(SEARCH_LIMIT),
    db('notes as n')
      .where('n.workspace_id', workspaceId)
      .where((w) => w.whereILike('n.title', contains).orWhereILike('n.content', contains))
      .select('n.id', 'n.title', 'n.content', 'n.color')
      .orderBy([{ column: rank('n.title') }, { column: 'n.updated_at', order: 'desc' }])
      .limit(SEARCH_LIMIT),
  ]);

  return {
    q,
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      status: p.status,
      // Нашлось только в описании — покажем, где именно
      snippet: snippetAround(p.title, q) ? null : snippetAround(p.description, q),
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.due_date,
      project: { id: t.project_id, title: t.project_title, type: t.project_type },
    })),
    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      color: n.color,
      snippet: snippetAround(n.content, q),
    })),
  };
};
