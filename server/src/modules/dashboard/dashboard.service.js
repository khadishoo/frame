import { db } from '../../config/db.js';
import { recentNotes } from '../notes/notes.service.js';
import { listProjects } from '../projects/projects.service.js';
import { listWorkspaceTasks } from '../tasks/tasks.service.js';

export const ACTIVITY_DAYS = 7;

/**
 * Задачи неархивных проектов пространства — база для всех «задачных» цифр дашборда.
 * Задачи архивных проектов не считаем: архив — это «убрано с глаз».
 */
const workspaceTasks = (workspaceId) =>
  db('tasks as t')
    .join('projects as p', 'p.id', 't.project_id')
    .where('p.workspace_id', workspaceId)
    .whereNull('p.archived_at');

/** «Сегодня» в часовом поясе пользователя — строкой «YYYY-MM-DD». */
const todayIn = async (tz) =>
  (await db.raw('SELECT (now() AT TIME ZONE ?)::date::text AS today', [tz])).rows[0].today;

/**
 * Сколько задач выполнено в каждый из последних 7 дней (включая сегодня) в поясе tz.
 * generate_series даёт все дни подряд — дни без задач приходят нулями, а не пропадают.
 */
const activity = async (workspaceId, tz, today) => {
  const { rows } = await db.raw(
    `SELECT d::date::text AS date, count(t.id)::int AS completed
     FROM generate_series(?::date - (? - 1), ?::date, interval '1 day') AS d
     LEFT JOIN tasks t
       ON t.status = 'done'
      AND (t.completed_at AT TIME ZONE ?)::date = d::date
      AND t.project_id IN (
        SELECT id FROM projects WHERE workspace_id = ? AND archived_at IS NULL
      )
     GROUP BY d
     ORDER BY d`,
    [today, ACTIVITY_DAYS, today, tz, workspaceId],
  );
  return rows;
};

/** Цифры для карточек и «есть ли вообще что-то» (онбординг нового пользователя). */
const counters = async (workspaceId, today) => {
  const [projects, tasks, notes] = await Promise.all([
    db('projects')
      .where({ workspace_id: workspaceId })
      .whereNull('archived_at')
      .first(
        db.raw('count(*)::int AS total'),
        db.raw("count(*) FILTER (WHERE status = 'active')::int AS active"),
      ),
    workspaceTasks(workspaceId).first(
      db.raw('count(*)::int AS total'),
      db.raw("count(*) FILTER (WHERE t.status IN ('in_progress', 'review'))::int AS in_progress"),
      db.raw("count(*) FILTER (WHERE t.status <> 'done' AND t.due_date < ?)::int AS overdue", [
        today,
      ]),
    ),
    db('notes').where({ workspace_id: workspaceId }).first(db.raw('count(*)::int AS total')),
  ]);
  return { projects, tasks, notes };
};

/**
 * Всё для дашборда одним ответом — запросы идут параллельно (Promise.all),
 * а не друг за другом: время ответа ≈ самый долгий запрос, а не их сумма.
 */
export const getDashboard = async (workspaceId, userId, { tz }) => {
  const today = await todayIn(tz);

  const [count, days, projects, upcoming, notes] = await Promise.all([
    counters(workspaceId, today),
    activity(workspaceId, tz, today),
    listProjects(workspaceId, { sort: 'updated_at', limit: 6, offset: 0 }),
    // Ближайшие дедлайны: с сегодняшнего дня, невыполненные (просроченные — в своей карточке)
    listWorkspaceTasks(workspaceId, userId, {
      due_from: today,
      status: ['todo', 'in_progress', 'review'],
      limit: 5,
      offset: 0,
    }),
    recentNotes(workspaceId, 3),
  ]);

  return {
    today,
    stats: {
      activeProjects: count.projects.active,
      tasksInProgress: count.tasks.in_progress,
      // Сумма графика — цифра и столбики не могут разойтись
      completedThisWeek: days.reduce((sum, day) => sum + day.completed, 0),
      overdue: count.tasks.overdue,
    },
    totals: { projects: count.projects.total, tasks: count.tasks.total, notes: count.notes.total },
    activity: days,
    recentProjects: projects.items,
    upcomingTasks: upcoming.items,
    recentNotes: notes,
  };
};
