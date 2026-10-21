import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

// Локально переменные берутся из server/.env, в CI — из окружения
dotenv.config({ path: '.env', quiet: true });

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    globalSetup: ['tests/globalSetup.js'],
    setupFiles: ['tests/setup.js'],
    // Все тесты работают с одной базой — файлы по очереди, не параллельно
    fileParallelism: false,
    testTimeout: 15_000,
    env: {
      NODE_ENV: 'test',
      // Приложение в тестах подключается к тестовой базе, а не к frame_dev
      ...(process.env.TEST_DATABASE_URL && { DATABASE_URL: process.env.TEST_DATABASE_URL }),
    },
  },
});
