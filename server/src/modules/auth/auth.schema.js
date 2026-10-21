import { z } from 'zod';

// Email нормализуем: без пробелов по краям и в нижнем регистре
const email = z
  .string({ error: 'Введите email' })
  .trim()
  .toLowerCase()
  .max(254, 'Слишком длинный email')
  .pipe(z.email({ error: 'Некорректный email' }));

const body = (shape) => z.object(shape, { error: 'Ожидается JSON-тело запроса' });

export const registerSchema = z.object({
  body: body({
    email,
    password: z
      .string({ error: 'Введите пароль' })
      .min(8, 'Пароль — минимум 8 символов')
      .max(128, 'Пароль — максимум 128 символов'),
    name: z
      .string({ error: 'Введите имя' })
      .trim()
      .min(1, 'Введите имя')
      .max(80, 'Имя — максимум 80 символов'),
    // Тема, выбранная до регистрации, переезжает в профиль
    theme: z.enum(['light', 'dark', 'system']).optional(),
  }),
});

export const loginSchema = z.object({
  body: body({
    email,
    // При входе длину не проверяем: иначе подсказали бы правила пароля
    password: z.string({ error: 'Введите пароль' }).min(1, 'Введите пароль').max(128),
  }),
});
