import { db } from '../../config/db.js';
import { findAccessible } from '../../middleware/access.js';
import { getNotesByIds } from '../notes/notes.service.js';
import { getProjectsByIds } from '../projects/projects.service.js';

// Что можно добавить в избранное: тип → таблица и сообщение «не найдено»
const ENTITIES = {
  project: { table: 'projects', notFound: 'Проект не найден' },
  note: { table: 'notes', notFound: 'Заметка не найдена' },
};

/**
 * Проставить isFavorite записям (проектам или заметкам) для пользователя — одним запросом
 * на весь список. Вызывают контроллеры: «в избранном» у каждого своё, сервисам проектов
 * и заметок про пользователя знать не нужно.
 */
export const markFavorites = async (userId, type, items) => {
  if (items.length === 0) return items;
  const ids = await db('favorites')
    .where({ user_id: userId, entity_type: type })
    .whereIn(
      'entity_id',
      items.map((item) => item.id),
    )
    .pluck('entity_id');
  const favorite = new Set(ids);
  return items.map((item) => ({ ...item, isFavorite: favorite.has(item.id) }));
};

export const markFavorite = async (userId, type, item) =>
  (await markFavorites(userId, type, [item]))[0];

/** Добавить в избранное. Запись ищется через членство: чужое → 404. Повтор — не ошибка. */
export const addFavorite = async (userId, { type, id }) => {
  const { table, notFound } = ENTITIES[type];
  await findAccessible(table, id, userId, notFound);
  await db('favorites')
    .insert({ user_id: userId, entity_type: type, entity_id: id })
    .onConflict(['user_id', 'entity_type', 'entity_id'])
    .ignore();
};

/** Убрать из избранного — только свою отметку; повтор — не ошибка. */
export const removeFavorite = (userId, { type, id }) =>
  db('favorites').where({ user_id: userId, entity_type: type, entity_id: id }).del();

/**
 * id избранного одного типа — последние отмеченные первыми. Только записи из пространств,
 * где пользователь ещё участник (если его исключат, чужие проекты не «утекут» через избранное).
 */
const favoriteIds = (userId, type) => {
  const { table } = ENTITIES[type];
  return db('favorites as f')
    .join(`${table} as r`, 'r.id', 'f.entity_id')
    .join('workspace_members as m', function joinMembership() {
      this.on('m.workspace_id', 'r.workspace_id').andOnVal('m.user_id', userId);
    })
    .where({ 'f.user_id': userId, 'f.entity_type': type })
    .orderBy('f.created_at', 'desc')
    .pluck('r.id');
};

/** Всё избранное пользователя: { projects, notes } (у всех isFavorite: true). */
export const listFavorites = async (userId) => {
  const [projectIds, noteIds] = await Promise.all([
    favoriteIds(userId, 'project'),
    favoriteIds(userId, 'note'),
  ]);
  const [projects, notes] = await Promise.all([
    getProjectsByIds(projectIds),
    getNotesByIds(noteIds),
  ]);
  const mark = (item) => ({ ...item, isFavorite: true });
  return { projects: projects.map(mark), notes: notes.map(mark) };
};
