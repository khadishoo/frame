import crypto from 'node:crypto';
import { db } from '../../config/db.js';
import { DEFAULT_CATEGORIES } from '../../config/domain.js';

const PERSONAL_WORKSPACE_NAME = 'Личное пространство';

/** slug из части email до @: «anna.k@mail.com» → «anna-k-3f9a2c1b» (латиница, уникален). */
const personalSlug = (email) => {
  const base =
    email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'user';
  return `${base}-${crypto.randomBytes(4).toString('hex')}`;
};

/** Категории по умолчанию для нового пространства. */
export const createDefaultCategories = (trx, workspaceId) =>
  trx('categories').insert(
    DEFAULT_CATEGORIES.map((category, position) => ({
      ...category,
      position,
      workspace_id: workspaceId,
    })),
  );

/**
 * Личное пространство + членство владельца + категории по умолчанию.
 * Вызывается внутри транзакции регистрации (trx), чтобы всё создалось или ничего.
 */
export const createPersonalWorkspace = async (trx, user) => {
  const [workspace] = await trx('workspaces')
    .insert({
      name: PERSONAL_WORKSPACE_NAME,
      slug: personalSlug(user.email),
      is_personal: true,
      owner_id: user.id,
    })
    .returning('*');

  await trx('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: 'owner',
  });

  await createDefaultCategories(trx, workspace.id);

  return workspace;
};

/** Пространства пользователя с его ролью; личное — первым. */
export const listUserWorkspaces = async (userId, trx = db) => {
  const rows = await trx('workspaces as w')
    .join('workspace_members as m', 'm.workspace_id', 'w.id')
    .where('m.user_id', userId)
    .select('w.id', 'w.name', 'w.slug', 'w.is_personal', 'm.role')
    .orderBy([
      { column: 'w.is_personal', order: 'desc' },
      { column: 'w.created_at', order: 'asc' },
    ]);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    isPersonal: row.is_personal,
    role: row.role,
  }));
};
