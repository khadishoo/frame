import { z } from 'zod';

// Творческие типы — те же, что у проектов (PROJECT_TYPES на клиенте)
export const CREATIVE_TYPES = ['art', 'music', 'video', 'photo', 'script', 'dev', 'other'];

export const updateMeSchema = z.object({
  body: z
    .object(
      {
        name: z
          .string({ error: 'Имя должно быть строкой' })
          .trim()
          .min(1, 'Введите имя')
          .max(80, 'Имя — максимум 80 символов')
          .optional(),
        creativeTypes: z
          .array(z.enum(CREATIVE_TYPES, { error: 'Неизвестный творческий тип' }), {
            error: 'Ожидается список типов',
          })
          .max(CREATIVE_TYPES.length)
          .transform((types) => [...new Set(types)]) // без повторов
          .optional(),
      },
      { error: 'Ожидается JSON-тело запроса' },
    )
    // Остальные поля профиля (bio, username, аватар) — на этапе 5
    .refine((body) => body.name !== undefined || body.creativeTypes !== undefined, {
      error: 'Нечего обновлять: передайте name или creativeTypes',
    }),
});
