import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';

/**
 * Пропускает запрос только с валидным access-токеном:
 * Authorization: Bearer <token>. Кладёт в req.user = { id }.
 */
export const requireAuth = (req, res, next) => {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return next(AppError.unauthorized());
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    return next();
  } catch (err) {
    return next(err); // TokenExpiredError / JsonWebTokenError → 401 в errorHandler
  }
};
