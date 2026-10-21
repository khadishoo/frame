import { z } from 'zod';
import { LABEL_COLORS } from '../../config/domain.js';

const name = z
  .string({ error: 'Введите название' })
  .trim()
  .min(1, 'Введите название')
  .max(40, 'Название — максимум 40 символов');

const color = z.enum(LABEL_COLORS, { error: `Цвет: ${LABEL_COLORS.join(', ')}` });

export const createLabelSchema = z.object({
  body: z.object({ name, color: color.optional() }, { error: 'Ожидается JSON-тело запроса' }),
});

export const updateLabelSchema = z.object({
  body: z
    .object(
      { name: name.optional(), color: color.optional() },
      { error: 'Ожидается JSON-тело запроса' },
    )
    .refine((body) => body.name !== undefined || body.color !== undefined, {
      error: 'Нечего обновлять: передайте name или color',
    }),
});
