import { describe, expect, it } from 'vitest';
import { api, registerUser, validUser } from './helpers.js';

const patchMe = (token, body) =>
  api().patch('/api/v1/users/me').set('Authorization', `Bearer ${token}`).send(body);

const registerOther = () =>
  registerUser({ ...validUser, email: 'boris@example.com', name: 'Борис' });

describe('PATCH /users/me — username', () => {
  it('сохраняет username как ввели и позволяет сохранить его повторно', async () => {
    const { body } = await registerUser();

    const res = await patchMe(body.accessToken, { username: 'Anna_K42' });
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('Anna_K42');

    // Тот же username у того же пользователя — не конфликт
    expect((await patchMe(body.accessToken, { username: 'Anna_K42' })).status).toBe(200);
  });

  it.each([
    ['ab', 'Username — минимум 3 символа'],
    ['a'.repeat(31), 'Username — максимум 30 символов'],
    ['анна', 'Только латинские буквы, цифры и _'],
    ['anna k', 'Только латинские буквы, цифры и _'],
    ['anna-k', 'Только латинские буквы, цифры и _'],
  ])('«%s» → 400', async (username, message) => {
    const { body } = await registerUser();
    const res = await patchMe(body.accessToken, { username });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0]).toEqual({ path: 'body.username', message });
  });

  it('занятый username (без учёта регистра) → 409 с ошибкой у поля', async () => {
    const other = await registerOther();
    await patchMe(other.body.accessToken, { username: 'frame_artist' });
    const { body } = await registerUser();

    const res = await patchMe(body.accessToken, { username: 'Frame_Artist' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
    expect(res.body.error.details).toEqual([
      { path: 'body.username', message: 'Этот username уже занят' },
    ]);
  });

  it('пустая строка или null очищает username', async () => {
    const { body } = await registerUser();
    await patchMe(body.accessToken, { username: 'anna' });

    expect((await patchMe(body.accessToken, { username: '' })).body.user.username).toBeNull();
    await patchMe(body.accessToken, { username: 'anna' });
    expect((await patchMe(body.accessToken, { username: null })).body.user.username).toBeNull();
  });
});

describe('PATCH /users/me — bio и тема', () => {
  it('bio до 300 символов, пробелы по краям обрезаются, пустая строка → null', async () => {
    const { body } = await registerUser();

    const ok = await patchMe(body.accessToken, { bio: `  ${'я'.repeat(300)}  ` });
    expect(ok.status).toBe(200);
    expect(ok.body.user.bio).toHaveLength(300);

    const tooLong = await patchMe(body.accessToken, { bio: 'я'.repeat(301) });
    expect(tooLong.status).toBe(400);
    expect(tooLong.body.error.details[0].path).toBe('body.bio');

    expect((await patchMe(body.accessToken, { bio: '   ' })).body.user.bio).toBeNull();
  });

  it('тема: light / dark / system; другое → 400', async () => {
    const { body } = await registerUser();

    for (const theme of ['dark', 'light', 'system']) {
      const res = await patchMe(body.accessToken, { theme });
      expect(res.body.user.theme).toBe(theme);
    }
    expect((await patchMe(body.accessToken, { theme: 'sepia' })).status).toBe(400);
  });

  it('несколько полей сразу', async () => {
    const { body } = await registerUser();
    const res = await patchMe(body.accessToken, {
      name: 'Анна К.',
      username: 'anna',
      bio: 'Рисую и пишу музыку',
      creativeTypes: ['art', 'music'],
      theme: 'dark',
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Анна К.',
      username: 'anna',
      bio: 'Рисую и пишу музыку',
      creativeTypes: ['art', 'music'],
      theme: 'dark',
    });
  });
});

describe('Тема при регистрации', () => {
  it('тема, выбранная до регистрации, сохраняется в профиле', async () => {
    const res = await registerUser({ ...validUser, theme: 'dark' });
    expect(res.status).toBe(201);
    expect(res.body.user.theme).toBe('dark');
  });

  it('без темы — system по умолчанию', async () => {
    const res = await registerUser();
    expect(res.body.user.theme).toBe('system');
  });
});
