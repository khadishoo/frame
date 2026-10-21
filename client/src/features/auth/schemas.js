import { z } from 'zod';

// Те же правила, что на сервере (server/src/modules/auth/auth.schema.js):
// клиент подсказывает сразу, сервер всё равно проверяет сам
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Введите email')
  .max(254, 'Слишком длинный email')
  .pipe(z.email({ error: 'Некорректный email' }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Введите пароль').max(128, 'Пароль — максимум 128 символов'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Введите имя').max(80, 'Имя — максимум 80 символов'),
  email,
  password: z
    .string()
    .min(1, 'Придумайте пароль')
    .min(8, 'Пароль — минимум 8 символов')
    .max(128, 'Пароль — максимум 128 символов'),
});
