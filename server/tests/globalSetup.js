import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import knex from 'knex';
import pg from 'pg';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Один раз перед всеми тестами: создать тестовую базу (если её нет) и применить миграции.
 */
export default async function setup() {
  dotenv.config({ path: path.join(serverRoot, '.env'), quiet: true });

  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Не задан TEST_DATABASE_URL (server/.env) — см. server/.env.example');
  }

  const dbName = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!/^[a-z0-9_]+_test$/.test(dbName)) {
    throw new Error(`Тестовая база должна называться *_test, а не «${dbName}»`);
  }

  // К служебной базе postgres — чтобы создать тестовую
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      dbName,
    ]);
    if (rowCount === 0) {
      // Имя проверено регуляркой выше, поэтому его можно подставить в SQL
      await admin.query(`CREATE DATABASE ${dbName} ENCODING 'UTF8' TEMPLATE template0`);
      // eslint-disable-next-line no-console -- сообщение для разработчика при первом запуске
      console.log(`Создана тестовая база ${dbName}`);
    }
  } finally {
    await admin.end();
  }

  const testDb = knex({
    client: 'pg',
    connection: url,
    migrations: {
      directory: path.join(serverRoot, 'src/db/migrations'),
      loadExtensions: ['.js'],
    },
  });
  try {
    await testDb.migrate.latest();
  } finally {
    await testDb.destroy();
  }
}
