import { describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { api, registerUser, validUser } from './helpers.js';

const patchMe = (token, body) => {
  const req = api().patch('/api/v1/users/me');
  return (token ? req.set('Authorization', `Bearer ${token}`) : req).send(body);
};

describe('PATCH /users/me', () => {
  it('обновляет имя и творческие типы (повторы убираются)', async () => {
    const { body } = await registerUser();

    const res = await patchMe(body.accessToken, {
      name: '  Анна К.  ',
      creativeTypes: ['music', 'art', 'music'],
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: 'Анна К.', creativeTypes: ['music', 'art'] });

    const row = await db('users').where({ id: body.user.id }).first();
    expect(row.creative_types).toEqual(['music', 'art']);
  });

  it('можно обновить только типы; пустой список — тоже валиден', async () => {
    const { body } = await registerUser();
    const res = await patchMe(body.accessToken, { creativeTypes: [] });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: validUser.name, creativeTypes: [] });
  });

  it('не меняет поля, которых нет в схеме (например, email)', async () => {
    const { body } = await registerUser();
    const res = await patchMe(body.accessToken, { name: 'Аня', email: 'hacker@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
  });

  it('неизвестный тип → 400', async () => {
    const { body } = await registerUser();
    const res = await patchMe(body.accessToken, { creativeTypes: ['music', 'cooking'] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toBe('body.creativeTypes.1');
  });

  it('пустое тело или пустое имя → 400', async () => {
    const { body } = await registerUser();
    expect((await patchMe(body.accessToken, {})).status).toBe(400);
    expect((await patchMe(body.accessToken, { name: '   ' })).status).toBe(400);
  });

  it('без токена → 401', async () => {
    const res = await patchMe(null, { name: 'Аня' });
    expect(res.status).toBe(401);
  });
});
