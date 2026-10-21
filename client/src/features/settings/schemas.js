import { z } from 'zod';

// Те же правила, что на сервере (server/src/modules/users/users.schema.js)

export const BIO_MAX = 300;

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Введите имя').max(80, 'Имя — максимум 80 символов'),
  // Пустое поле = «без username»
  username: z
    .string()
    .trim()
    .refine((value) => value === '' || value.length >= 3, 'Username — минимум 3 символа')
    .refine((value) => value.length <= 30, 'Username — максимум 30 символов')
    .refine(
      (value) => value === '' || /^[a-zA-Z0-9_]+$/.test(value),
      'Только латинские буквы, цифры и _',
    ),
  bio: z.string().max(BIO_MAX, `О себе — максимум ${BIO_MAX} символов`),
  creativeTypes: z.array(z.string()),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z
      .string()
      .min(1, 'Придумайте новый пароль')
      .min(8, 'Новый пароль — минимум 8 символов')
      .max(128, 'Пароль — максимум 128 символов'),
    confirmPassword: z.string().min(1, 'Повторите новый пароль'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  })
  .refine((data) => data.confirmPassword === data.newPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
