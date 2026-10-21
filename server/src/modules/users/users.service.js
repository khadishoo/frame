import { db } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';

/** Пользователь для ответа API: camelCase и никакого password_hash. */
export const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  username: user.username,
  bio: user.bio,
  avatarUrl: user.avatar_url,
  creativeTypes: user.creative_types,
  theme: user.theme,
  createdAt: user.created_at,
});

export const findUserById = (id, trx = db) => trx('users').where({ id }).first();

export const findUserByEmail = (email, trx = db) => trx('users').where({ email }).first();

/** Частичное обновление профиля. Поля API (camelCase) → колонки БД (snake_case). */
export const updateMe = async (userId, { name, creativeTypes }) => {
  const changes = {};
  if (name !== undefined) changes.name = name;
  if (creativeTypes !== undefined) changes.creative_types = creativeTypes;

  const [user] = await db('users').where({ id: userId }).update(changes).returning('*');
  // Токен ещё жив, а пользователя уже нет
  if (!user) throw AppError.unauthorized();
  return toPublicUser(user);
};
