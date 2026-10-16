import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

// .env лежит в корне server/, независимо от того, откуда запущен процесс
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(serverRoot, '.env'), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string({ error: 'не задан' })
    .regex(/^postgres(ql)?:\/\//, 'должен начинаться с postgres:// или postgresql://'),
  CLIENT_URL: z.url({ error: 'должен быть URL, например http://localhost:5180' }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  console.error(
    [
      '',
      '❌ Ошибка в переменных окружения (server/.env):',
      ...lines,
      '',
      'Скопируйте server/.env.example в server/.env и заполните значения.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
});
