import { db } from '../../config/db.js';
import { env } from '../../config/env.js';
import { generateRefreshToken, hashToken, signAccessToken } from '../../utils/tokens.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Новая сессия: access JWT + refresh-токен (в БД — только его хэш). */
export const createSession = async (userId, { userAgent } = {}, trx = db) => {
  const refreshToken = generateRefreshToken();

  await trx('refresh_tokens').insert({
    user_id: userId,
    token_hash: hashToken(refreshToken),
    expires_at: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    user_agent: userAgent?.slice(0, 255) ?? null,
  });

  return { accessToken: signAccessToken(userId), refreshToken };
};

/** Завершить все сессии пользователя (на всех устройствах). */
export const revokeAllSessions = (userId, trx = db) =>
  trx('refresh_tokens')
    .where({ user_id: userId })
    .whereNull('revoked_at')
    .update({ revoked_at: trx.fn.now() });
