/**
 * API для E2E-тестов (Playwright): каждый запуск — с чистой базой *_e2e.
 * 1) пересоздаёт базу (DROP … WITH (FORCE) + CREATE), 2) применяет миграции,
 * 3) запускает обычный src/server.js с этой базой.
 *
 * База: E2E_DATABASE_URL или DATABASE_URL из server/.env с именем базы frame_e2e.
 * Порт и адрес клиента задаёт playwright.config.js (PORT, CLIENT_URL).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import knex from 'knex';
import pg from 'pg';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(serverRoot, '.env'), quiet: true });

const source = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
if (!source) throw new Error('Не задан ни E2E_DATABASE_URL, ни DATABASE_URL (server/.env)');

const url = new URL(source);
if (!process.env.E2E_DATABASE_URL) url.pathname = '/frame_e2e';
const dbName = decodeURIComponent(url.pathname.slice(1));
// Предохранитель: эту базу скрипт удаляет целиком
if (!/^[a-z0-9_]+_e2e$/.test(dbName)) {
  throw new Error(`База для E2E должна называться *_e2e, а не «${dbName}»`);
}

const adminUrl = new URL(url);
adminUrl.pathname = '/postgres';
const admin = new pg.Client({ connectionString: adminUrl.toString() });
await admin.connect();
try {
  // Имя проверено регуляркой выше, поэтому его можно подставить в SQL
  await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${dbName} ENCODING 'UTF8' TEMPLATE template0`);
} finally {
  await admin.end();
}

const db = knex({
  client: 'pg',
  connection: url.toString(),
  migrations: { directory: path.join(serverRoot, 'src/db/migrations'), loadExtensions: ['.js'] },
});
try {
  await db.migrate.latest();
} finally {
  await db.destroy();
}

// env.js читает process.env при импорте; dotenv уже заданные переменные не перезаписывает
process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV ??= 'development';
await import('../src/server.js');
