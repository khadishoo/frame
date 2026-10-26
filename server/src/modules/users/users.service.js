import argon2 from 'argon2';
import { db } from '../../config/db.js';
import { DEMO_EMAIL } from '../../config/domain.js';
import { AppError } from '../../utils/AppError.js';
import { createSession, revokeAllSessions } from '../auth/sessions.js';

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

// Поля API (camelCase) → колонки БД (snake_case)
const COLUMNS = {
  name: 'name',
  username: 'username',
  bio: 'bio',
  creativeTypes: 'creative_types',
  theme: 'theme',
};

/** Ошибка, привязанная к полю формы (клиент покажет её под этим полем). */
const fieldError = (status, code, field, message) =>
  new AppError(status, code, message, [{ path: `body.${field}`, message }]);

/** Пользователь по id; если его уже нет, а токен ещё жив — 401. */
const getExistingUser = async (userId) => {
  const user = await findUserById(userId);
  if (!user) throw AppError.unauthorized();
  return user;
};

/** Проверка пароля перед чувствительным действием; неверный — ошибка у поля формы. */
const assertPassword = async (user, password, field) => {
  if (!(await argon2.verify(user.password_hash, password))) {
    throw fieldError(400, 'VALIDATION_ERROR', field, 'Неверный пароль');
  }
};

/** Частичное обновление профиля: меняются только переданные поля. */
export const updateMe = async (userId, data) => {
  const changes = {};
  for (const [field, column] of Object.entries(COLUMNS)) {
    if (data[field] !== undefined) changes[column] = data[field];
  }

  let user;
  try {
    [user] = await db('users').where({ id: userId }).update(changes).returning('*');
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'users_username_unique') {
      throw fieldError(409, 'USERNAME_TAKEN', 'username', 'Этот username уже занят');
    }
    throw err;
  }

  if (!user) throw AppError.unauthorized(); // токен ещё жив, а пользователя уже нет
  return toPublicUser(user);
};

/**
 * Смена пароля. Отзываются ВСЕ refresh-токены (другие устройства выйдут),
 * а текущему устройству сразу выдаётся новая пара — оно остаётся в системе.
 * (Refresh-cookie на /users/* не приходит, поэтому «текущую» сессию не отличить —
 * проще и надёжнее заменить её новой.)
 */
const assertNotDemo = (user) => {
  if (user.email === DEMO_EMAIL) {
    throw new AppError(403, 'DEMO_ACCOUNT', 'В демо-аккаунте это недоступно — зарегистрируйтесь');
  }
};

export const changePassword = async (userId, { currentPassword, newPassword }, meta) => {
  const user = await getExistingUser(userId);
  assertNotDemo(user);
  await assertPassword(user, currentPassword, 'currentPassword');

  const passwordHash = await argon2.hash(newPassword);

  return db.transaction(async (trx) => {
    await trx('users').where({ id: userId }).update({ password_hash: passwordHash });
    await revokeAllSessions(userId, trx);
    const tokens = await createSession(userId, meta, trx);
    return { user: toPublicUser(user), ...tokens };
  });
};

/**
 * Удалить пользователя со всеми его данными. Порядок важен: сначала пространства, где он
 * владелец (каскадом — проекты и задачи), потом сам пользователь (сессии, членства).
 * Одним DELETE users нельзя: у задачи две ссылки на пользователя (автор и исполнитель),
 * PostgreSQL обнуляет их по очереди, и второе обновление проверяет ссылку на проект,
 * который в той же команде уже удалён, → ошибка внешнего ключа.
 */
const deleteUserCascade = (userId) =>
  db.transaction(async (trx) => {
    await trx('workspaces').where({ owner_id: userId }).del();
    await trx('users').where({ id: userId }).del();
  });

/** Удаление аккаунта (с подтверждением паролем). */
export const deleteMe = async (userId, { password }) => {
  const user = await getExistingUser(userId);
  assertNotDemo(user);
  await assertPassword(user, password, 'password');
  await deleteUserCascade(userId);
};
