import { afterAll, beforeEach } from 'vitest';
import { db } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { resetRateLimits } from '../src/middleware/rateLimit.js';

// Предохранитель: тесты стирают данные, поэтому работают только с базой *_test
const dbName = new URL(env.DATABASE_URL).pathname.slice(1);
if (!dbName.endsWith('_test')) {
  throw new Error(`Тесты очищают таблицы и не запускаются на базе «${dbName}»`);
}

beforeEach(async () => {
  // Новую таблицу — добавить сюда (CASCADE подчистит и зависимые, но явно — понятнее)
  await db.raw(
    'TRUNCATE users, refresh_tokens, workspaces, workspace_members, categories, tags, projects, project_tags CASCADE',
  );
  await resetRateLimits();
});

afterAll(async () => {
  await db.destroy();
});
