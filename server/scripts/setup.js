/**
 * Первый запуск на новой машине (npm run setup из корня вызывает этот скрипт после установки
 * зависимостей):
 * 1) если в server/.env пустой JWT_ACCESS_SECRET — генерирует случайный и записывает в файл;
 * 2) создаёт базу из DATABASE_URL, если её ещё нет;
 * 3) применяет миграции и заливает демо-данные (сид пересоздаёт только демо-аккаунт).
 * Повторный запуск безопасен: существующие база, секрет и чужие данные не трогаются.
 */
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import knex from 'knex';
import pg from 'pg';

/* eslint-disable no-console -- скрипт для разработчика, пишет, что сделал */

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(serverRoot, '.env');

if (!fs.existsSync(envPath)) {
  console.error('Нет server/.env — скопируйте server/.env.example и впишите пароль PostgreSQL.');
  process.exit(1);
}

let envText = fs.readFileSync(envPath, 'utf8');
if (/^JWT_ACCESS_SECRET=\s*$/m.test(envText)) {
  const secret = randomBytes(64).toString('base64url');
  envText = envText.replace(/^JWT_ACCESS_SECRET=\s*$/m, `JWT_ACCESS_SECRET=${secret}`);
  fs.writeFileSync(envPath, envText);
  console.log('✓ JWT_ACCESS_SECRET сгенерирован и записан в server/.env');
}
dotenv.config({ path: envPath, quiet: true });

const url = new URL(process.env.DATABASE_URL);
const dbName = decodeURIComponent(url.pathname.slice(1));
if (!/^[a-z0-9_]+$/.test(dbName)) {
  throw new Error(`Имя базы «${dbName}»: только латиница в нижнем регистре, цифры и _`);
}

const adminUrl = new URL(url);
adminUrl.pathname = '/postgres';
const admin = new pg.Client({ connectionString: adminUrl.toString() });
await admin.connect();
try {
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (rowCount === 0) {
    // Имя проверено регуляркой выше, поэтому его можно подставить в SQL
    await admin.query(`CREATE DATABASE ${dbName} ENCODING 'UTF8' TEMPLATE template0`);
    console.log(`✓ Создана база ${dbName}`);
  } else {
    console.log(`✓ База ${dbName} уже есть`);
  }
} finally {
  await admin.end();
}

const db = knex({
  client: 'pg',
  connection: url.toString(),
  migrations: { directory: path.join(serverRoot, 'src/db/migrations'), loadExtensions: ['.js'] },
  seeds: { directory: path.join(serverRoot, 'src/db/seeds'), loadExtensions: ['.js'] },
});
try {
  const [, applied] = await db.migrate.latest();
  console.log(`✓ Миграции: применено новых — ${applied.length}`);
  await db.seed.run();
} finally {
  await db.destroy();
}

console.log('\nГотово. Запуск: npm run dev → http://localhost:5180 («Войти как демо»)');
