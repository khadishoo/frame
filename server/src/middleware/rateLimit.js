import { MemoryStore, rateLimit } from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

const stores = [];

/**
 * Ограничитель частоты запросов с IP. Ответ при превышении — в общем формате ошибок.
 * Счётчики в памяти процесса: для одного сервера достаточно (при нескольких — Redis).
 */
const createLimiter = ({ windowMs, limit, message }) => {
  const store = new MemoryStore();
  stores.push(store);

  return rateLimit({
    windowMs,
    limit,
    store,
    standardHeaders: 'draft-7', // заголовок RateLimit: limit, remaining, reset
    legacyHeaders: false,
    handler: (req, res, next) => next(new AppError(429, 'TOO_MANY_REQUESTS', message)),
  });
};

const AUTH_MESSAGE = 'Слишком много попыток. Попробуйте через минуту';

export const loginLimiter = createLimiter({ windowMs: 60_000, limit: 5, message: AUTH_MESSAGE });
export const registerLimiter = createLimiter({ windowMs: 60_000, limit: 5, message: AUTH_MESSAGE });

// Действия, подтверждаемые паролем: через них тоже нельзя подбирать пароль
export const accountLimiters = {
  changePassword: createLimiter({ windowMs: 60_000, limit: 5, message: AUTH_MESSAGE }),
  deleteAccount: createLimiter({ windowMs: 60_000, limit: 5, message: AUTH_MESSAGE }),
};

/** Сброс счётчиков — нужен тестам, чтобы лимит одного теста не влиял на другой. */
export const resetRateLimits = () => Promise.all(stores.map((store) => store.resetAll()));
