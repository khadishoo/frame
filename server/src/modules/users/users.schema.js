import { z } from 'zod';

// Творческие типы — те же, что у проектов (PROJECT_TYPES на клиенте)
export const CREATIVE_TYPES = ['art', 'music', 'video', 'photo', 'script', 'dev', 'other'];
export const THEMES = ['light', 'dark', 'system'];

const body = (shape) => z.object(shape, { error: 'Ожидается JSON-тело запроса' });

// Пустая строка в необязательном текстовом поле = «очистить» (null)
const emptyToNull = (value) => (typeof value === 'string' && value.trim() === '' ? null : value);

const requiredPassword = (label) =>
  z
    .string({ error: `Введите ${label}` })
    .min(1, `Введите ${label}`)
    .max(128, 'Пароль — максимум 128 символов');

export const updateMeSchema = z.object({
  body: body({
    name: z
      .string({ error: 'Имя должно быть строкой' })
      .trim()
      .min(1, 'Введите имя')
      .max(80, 'Имя — максимум 80 символов')
      .optional(),
    username: z
      .preprocess(
        emptyToNull,
        z
          .string({ error: 'Username должен быть строкой' })
          .trim()
          .min(3, 'Username — минимум 3 символа')
          .max(30, 'Username — максимум 30 символов')
          .regex(/^[a-zA-Z0-9_]+$/, 'Только латинские буквы, цифры и _')
          .nullable(),
      )
      .optional(),
    bio: z
      .preprocess(
        emptyToNull,
        z
          .string({ error: 'Описание должно быть строкой' })
          .trim()
          .max(300, 'О себе — максимум 300 символов')
          .nullable(),
      )
      .optional(),
    creativeTypes: z
      .array(z.enum(CREATIVE_TYPES, { error: 'Неизвестный творческий тип' }), {
        error: 'Ожидается список типов',
      })
      .max(CREATIVE_TYPES.length)
      .transform((types) => [...new Set(types)]) // без повторов
      .optional(),
    theme: z.enum(THEMES, { error: 'Тема: light, dark или system' }).optional(),
  }).refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: 'Нечего обновлять: передайте хотя бы одно поле',
  }),
});

export const changePasswordSchema = z.object({
  body: body({
    currentPassword: requiredPassword('текущий пароль'),
    newPassword: z
      .string({ error: 'Введите новый пароль' })
      .min(8, 'Новый пароль — минимум 8 символов')
      .max(128, 'Пароль — максимум 128 символов'),
  }).refine((data) => data.newPassword !== data.currentPassword, {
    error: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  }),
});

export const deleteMeSchema = z.object({
  body: body({ password: requiredPassword('пароль') }),
});
