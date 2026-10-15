import { app } from './app.js';
import { env } from './config/env.js';
import { db } from './config/db.js';
import { logger } from './config/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`API запущен: http://localhost:${env.PORT}/api/v1/health (${env.NODE_ENV})`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.fatal(`Порт ${env.PORT} уже занят. Остановите другой процесс или смените PORT в .env`);
  } else {
    logger.fatal({ err }, 'Не удалось запустить сервер');
  }
  process.exit(1);
});

// Корректное завершение: дописать текущие запросы и закрыть пул соединений с БД
const shutdown = (signal) => {
  logger.info(`${signal}: останавливаю сервер…`);
  server.close(async () => {
    await db.destroy();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
