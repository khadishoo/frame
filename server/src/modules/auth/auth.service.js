import argon2 from 'argon2';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { generateRefreshToken, hashToken, signAccessToken } from '../../utils/tokens.js';
import { findUserByEmail, findUserById, toPublicUser } from '../users/users.service.js';
import { createPersonalWorkspace, listUserWorkspaces } from '../workspaces/workspaces.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const invalidCredentials = () =>
  new AppError(401, 'INVALID_CREDENTIALS', 'Неверный email или пароль');

const invalidSession = () =>
  new AppError(401, 'INVALID_REFRESH_TOKEN', 'Сессия истекла. Войдите снова');

// Хэш-«пустышка»: при несуществующем email всё равно тратим время на проверку пароля,
// чтобы по скорости ответа нельзя было узнать, зарегистрирован ли email
let dummyHash;
const getDummyHash = () => {
  dummyHash ??= argon2.hash('frame-timing-equalizer');
  return dummyHash;
};

/** Новая сессия: access JWT + refresh-токен (в БД — только его хэш). */
const createSession = async (userId, { userAgent } = {}, trx = db) => {
  const refreshToken = generateRefreshToken();

  await trx('refresh_tokens').insert({
    user_id: userId,
    token_hash: hashToken(refreshToken),
    expires_at: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    user_agent: userAgent?.slice(0, 255) ?? null,
  });

  return { accessToken: signAccessToken(userId), refreshToken };
};

const revokeAllSessions = (userId, trx = db) =>
  trx('refresh_tokens')
    .where({ user_id: userId })
    .whereNull('revoked_at')
    .update({ revoked_at: trx.fn.now() });

export const register = async ({ email, password, name }, meta) => {
  const passwordHash = await argon2.hash(password); // argon2id по умолчанию

  let user;
  try {
    // Пользователь, личное пространство и членство — одной транзакцией:
    // если что-то упадёт, в БД не останется «половины» регистрации
    user = await db.transaction(async (trx) => {
      const [created] = await trx('users')
        .insert({ email, password_hash: passwordHash, name })
        .returning('*');
      await createPersonalWorkspace(trx, created);
      return created;
    });
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'users_email_unique') {
      throw new AppError(409, 'EMAIL_TAKEN', 'Пользователь с таким email уже зарегистрирован');
    }
    throw err;
  }

  const tokens = await createSession(user.id, meta);
  return { user: toPublicUser(user), ...tokens };
};

export const login = async ({ email, password }, meta) => {
  const user = await findUserByEmail(email);

  // Одинаковая ошибка и сопоставимое время ответа для «нет email» и «неверный пароль»
  const passwordOk = user
    ? await argon2.verify(user.password_hash, password)
    : (await argon2.verify(await getDummyHash(), password), false);

  if (!passwordOk) throw invalidCredentials();

  const tokens = await createSession(user.id, meta);
  return { user: toPublicUser(user), ...tokens };
};

/**
 * Ротация: старый refresh-токен отзывается, выдаётся новая пара.
 * Если пришёл уже отозванный токен — его кто-то украл и использовал (или наоборот),
 * поэтому отзываем ВСЕ сессии пользователя.
 */
export const refresh = async (rawToken, meta) => {
  if (!rawToken) throw invalidSession();

  // Внутри транзакции только решаем, что делать; ошибку бросаем после COMMIT,
  // иначе отзыв всех сессий откатился бы вместе с транзакцией
  const result = await db.transaction(async (trx) => {
    const session = await trx('refresh_tokens')
      .where({ token_hash: hashToken(rawToken) })
      .forUpdate() // два параллельных refresh одним токеном не пройдут оба
      .first();

    if (!session) return { status: 'invalid' };

    if (session.revoked_at) {
      await revokeAllSessions(session.user_id, trx);
      return { status: 'reused' };
    }

    if (session.expires_at <= new Date()) return { status: 'invalid' };

    await trx('refresh_tokens').where({ id: session.id }).update({ revoked_at: trx.fn.now() });
    const tokens = await createSession(session.user_id, meta, trx);
    const user = await findUserById(session.user_id, trx);
    return { status: 'ok', user: toPublicUser(user), ...tokens };
  });

  if (result.status === 'reused') {
    throw new AppError(
      401,
      'REFRESH_TOKEN_REUSED',
      'Сессия недействительна: все сеансы завершены. Войдите снова',
    );
  }
  if (result.status !== 'ok') throw invalidSession();

  return { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken };
};

export const logout = async (rawToken) => {
  if (!rawToken) return;
  await db('refresh_tokens')
    .where({ token_hash: hashToken(rawToken) })
    .whereNull('revoked_at')
    .update({ revoked_at: db.fn.now() });
};

export const getMe = async (userId) => {
  const user = await findUserById(userId);
  // Токен ещё жив, а пользователь удалён — считаем сессию недействительной
  if (!user) throw AppError.unauthorized();

  return { user: toPublicUser(user), workspaces: await listUserWorkspaces(userId) };
};
