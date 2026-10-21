import { db } from '../../config/db.js';

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
