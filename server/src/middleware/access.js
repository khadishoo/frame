import { db } from '../config/db.js';
import { WORKSPACE_ROLES } from '../config/domain.js';
import { AppError } from '../utils/AppError.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Кривой id в URL — это «не найдено», а не ошибка 500 от PostgreSQL. */
export const isUuid = (value) => typeof value === 'string' && UUID_RE.test(value);

/**
 * Роль пользователя в пространстве или null, если он не участник.
 */
export const getMembership = async (workspaceId, userId, trx = db) => {
  if (!isUuid(workspaceId)) return null;
  return trx('workspace_members')
    .where({ workspace_id: workspaceId, user_id: userId })
    .first('workspace_id as workspaceId', 'role');
};

/**
 * Записи без своего workspace_id: пространство берём у родителя.
 * Задача → её проект (заодно отдаём workspace_id и признак архива проекта).
 */
const PARENT_SCOPES = {
  tasks: {
    join: ['projects as p', 'p.id', 'r.project_id'],
    workspaceColumn: 'p.workspace_id',
    columns: ['p.workspace_id', 'p.archived_at as project_archived_at'],
  },
};

/**
 * Найти запись (проект, категорию, тег, задачу) только в пространствах, где пользователь
 * участник. Чужая запись для него «не существует» → 404 (не раскрываем, что она есть).
 * Возвращает { record, membership }.
 */
export const findAccessible = async (table, id, userId, notFoundMessage, trx = db) => {
  if (!isUuid(id)) throw AppError.notFound(notFoundMessage);

  const scope = PARENT_SCOPES[table];
  const query = trx(`${table} as r`);
  if (scope) query.join(...scope.join);

  const row = await query
    .join('workspace_members as m', function joinMembership() {
      this.on('m.workspace_id', scope?.workspaceColumn ?? 'r.workspace_id').andOnVal(
        'm.user_id',
        userId,
      );
    })
    .where('r.id', id)
    .first('r.*', ...(scope?.columns ?? []), 'm.role as member_role');

  if (!row) throw AppError.notFound(notFoundMessage);

  const { member_role: role, ...record } = row;
  return { record, membership: { workspaceId: record.workspace_id, role } };
};

/** Хелпер из PLAN 3.4: проект пользователя или 404. */
export const assertProjectAccess = (projectId, userId, trx) =>
  findAccessible('projects', projectId, userId, 'Проект не найден', trx);

/**
 * Middleware: /workspaces/:wsId/* — только для участников пространства.
 * Не участник (или такого пространства нет) → 404. Кладёт req.membership.
 */
export const loadWorkspace = async (req, res, next) => {
  try {
    const membership = await getMembership(req.params.wsId, req.user.id);
    if (!membership) return next(AppError.notFound('Пространство не найдено'));
    req.membership = membership;
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Middleware: /:id ресурса (проект, категория, тег, задача). Проверяет, что запись из пространства
 * пользователя; кладёт req.record и req.membership.
 */
export const loadRecord = (table, notFoundMessage) => async (req, res, next) => {
  try {
    const { record, membership } = await findAccessible(
      table,
      req.params.id,
      req.user.id,
      notFoundMessage,
    );
    req.record = record;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

/** Роль A не ниже роли B? (owner > admin > member > viewer) */
export const hasRole = (role, minRole) =>
  WORKSPACE_ROLES.indexOf(role) <= WORKSPACE_ROLES.indexOf(minRole);

/** Middleware: роль в текущем пространстве не ниже minRole, иначе 403. */
export const requireRole = (minRole) => (req, res, next) => {
  if (!req.membership || !hasRole(req.membership.role, minRole)) {
    return next(AppError.forbidden('Недостаточно прав в этом пространстве'));
  }
  return next();
};
