import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Приводит любую ошибку к виду { status, code, message, details }.
 */
const normalize = (err) => {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }

  if (err instanceof ZodError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Ошибка валидации',
      details: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    };
  }

  // Невалидный JSON в теле запроса (от express.json)
  if (err.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Некорректный JSON в теле запроса' };
  }

  if (err.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Слишком большое тело запроса' };
  }

  // Клиент по TOKEN_EXPIRED понимает, что пора обновить access-токен через /auth/refresh
  if (err.name === 'TokenExpiredError') {
    return { status: 401, code: 'TOKEN_EXPIRED', message: 'Срок действия токена истёк' };
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return { status: 401, code: 'UNAUTHORIZED', message: 'Недействительный токен' };
  }

  // PostgreSQL: нарушение уникальности
  if (err.code === '23505') {
    return { status: 409, code: 'CONFLICT', message: 'Такая запись уже существует' };
  }

  return { status: 500, code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' };
};

// eslint-disable-next-line no-unused-vars -- Express распознаёт error-middleware по 4 аргументам
export const errorHandler = (err, req, res, next) => {
  const { status, code, message, details } = normalize(err);

  if (status >= 500) {
    req.log.error({ err }, message);
  }

  const body = { error: { code, message, details: details ?? null } };
  if (env.isDev) {
    body.error.stack = err.stack;
  }

  res.status(status).json(body);
};
