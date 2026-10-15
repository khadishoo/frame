import { db } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

export const checkHealth = async () => {
  try {
    await db.raw('SELECT 1');
  } catch (err) {
    // Текст ошибки PostgreSQL может раскрывать детали подключения — только в development
    throw new AppError(
      503,
      'DB_UNAVAILABLE',
      'Нет соединения с базой данных',
      env.isDev ? { reason: err.message } : undefined,
    );
  }

  return { status: 'ok', db: 'ok' };
};
