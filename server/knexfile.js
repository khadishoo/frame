import { env } from './src/config/env.js';

// Одна конфигурация для всех окружений: отличается только DATABASE_URL в .env
const config = {
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: { min: 0, max: 10 },
  migrations: {
    directory: './src/db/migrations',
    tableName: 'knex_migrations',
    loadExtensions: ['.js'],
  },
  seeds: {
    directory: './src/db/seeds',
    loadExtensions: ['.js'],
  },
};

export default config;
