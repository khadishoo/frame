import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ALGORITHM = 'HS256';

/** Access-токен: короткоживущий JWT, в payload только id пользователя (sub). */
export const signAccessToken = (userId) =>
  jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.JWT_ACCESS_TTL,
    algorithm: ALGORITHM,
  });

/** Бросает JsonWebTokenError / TokenExpiredError — errorHandler превратит их в 401. */
export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [ALGORITHM] });

/** Refresh-токен: 48 случайных байт. Уходит только в httpOnly cookie. */
export const generateRefreshToken = () => crypto.randomBytes(48).toString('base64url');

/** В БД храним только SHA-256 хэш: утечка таблицы не даст войти чужими сессиями. */
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
