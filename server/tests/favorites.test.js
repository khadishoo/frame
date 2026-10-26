import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { as, setupUser } from './helpers.js';

// Анна — владелица проекта и заметки; Борис — посторонний (или участник с ролью)
let anna;
let boris;
let annaProject;
let annaNote;

const fav = (token, type, id) => as(token).post('/api/v1/favorites').send({ type, id });
const unfav = (token, type, id) => as(token).delete(`/api/v1/favorites/${type}/${id}`);
const favorites = async (token) => (await as(token).get('/api/v1/favorites')).body;

beforeEach(async () => {
  anna = await setupUser();
  boris = await setupUser({ email: 'boris@example.com', name: 'Борис' });
  annaProject = (
    await as(anna.token)
      .post(`/api/v1/workspaces/${anna.wsId}/projects`)
      .send({ title: 'Дневник', type: 'script' })
  ).body;
  annaNote = (
    await as(anna.token)
      .post(`/api/v1/workspaces/${anna.wsId}/notes`)
      .send({ title: 'Секретная идея', projectId: annaProject.id })
  ).body;
});

describe('Избранное', () => {
  it('добавить проект и заметку → isFavorite в ответах и в списке избранного', async () => {
    expect((await fav(anna.token, 'project', annaProject.id)).status).toBe(201);
    expect((await fav(anna.token, 'note', annaNote.id)).status).toBe(201);

    const a = as(anna.token);
    expect((await a.get(`/api/v1/projects/${annaProject.id}`)).body.isFavorite).toBe(true);
    expect((await a.get(`/api/v1/workspaces/${anna.wsId}/projects`)).body.items[0].isFavorite).toBe(
      true,
    );
    expect((await a.get(`/api/v1/notes/${annaNote.id}`)).body.isFavorite).toBe(true);
    expect((await a.get(`/api/v1/workspaces/${anna.wsId}/notes`)).body.items[0].isFavorite).toBe(
      true,
    );

    const list = await favorites(anna.token);
    expect(list.projects).toEqual([
      expect.objectContaining({ id: annaProject.id, title: 'Дневник', isFavorite: true }),
    ]);
    expect(list.notes).toEqual([
      expect.objectContaining({ id: annaNote.id, title: 'Секретная идея', isFavorite: true }),
    ]);
  });

  it('повторное добавление и удаление — не ошибка; последние отмеченные — первыми', async () => {
    const second = (
      await as(anna.token)
        .post(`/api/v1/workspaces/${anna.wsId}/projects`)
        .send({ title: 'Альбом', type: 'music' })
    ).body;
    await fav(anna.token, 'project', annaProject.id);
    expect((await fav(anna.token, 'project', annaProject.id)).status).toBe(201);
    await fav(anna.token, 'project', second.id);
    expect((await favorites(anna.token)).projects.map((p) => p.title)).toEqual([
      'Альбом',
      'Дневник',
    ]);

    expect((await unfav(anna.token, 'project', second.id)).status).toBe(204);
    expect((await unfav(anna.token, 'project', second.id)).status).toBe(204);
    expect((await favorites(anna.token)).projects.map((p) => p.title)).toEqual(['Дневник']);
  });

  it('у каждого своё: отметка Анны не видна участнику Борису', async () => {
    await db('workspace_members').insert({
      workspace_id: anna.wsId,
      user_id: boris.user.id,
      role: 'member',
    });
    await fav(anna.token, 'project', annaProject.id);

    const asBoris = await as(boris.token).get(`/api/v1/projects/${annaProject.id}`);
    expect(asBoris.body.isFavorite).toBe(false);
    expect((await favorites(boris.token)).projects).toEqual([]);
  });

  it('валидация типа и id', async () => {
    const res = await as(anna.token).post('/api/v1/favorites').send({ type: 'task', id: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.path)).toEqual(['body.type', 'body.id']);
    expect((await unfav(anna.token, 'task', annaProject.id)).status).toBe(400);
  });
});

describe('Удаление записи убирает её из избранного (триггер в БД)', () => {
  it('удалили заметку', async () => {
    await fav(anna.token, 'note', annaNote.id);
    await as(anna.token).delete(`/api/v1/notes/${annaNote.id}`);
    expect(await db('favorites')).toHaveLength(0);
  });

  it('удалили проект — у всех, кто его отметил', async () => {
    await db('workspace_members').insert({
      workspace_id: anna.wsId,
      user_id: boris.user.id,
      role: 'member',
    });
    await fav(anna.token, 'project', annaProject.id);
    await fav(boris.token, 'project', annaProject.id);

    await as(anna.token).delete(`/api/v1/projects/${annaProject.id}`);
    expect(await db('favorites')).toHaveLength(0);
  });

  it('удалили аккаунт Анны (каскадом — её пространство): у Бориса отметки тоже исчезли', async () => {
    await db('workspace_members').insert({
      workspace_id: anna.wsId,
      user_id: boris.user.id,
      role: 'member',
    });
    await fav(boris.token, 'project', annaProject.id);
    await fav(boris.token, 'note', annaNote.id);

    const res = await as(anna.token)
      .delete('/api/v1/users/me')
      .send({ password: 'correct-horse-42' });
    expect(res.status).toBe(204);
    expect(await db('favorites')).toHaveLength(0);
  });
});

describe('Безопасность', () => {
  it('нельзя добавить в избранное чужой проект или заметку → 404', async () => {
    const p = await fav(boris.token, 'project', annaProject.id);
    const n = await fav(boris.token, 'note', annaNote.id);
    expect(p.status).toBe(404);
    expect(p.body.error.message).toBe('Проект не найден');
    expect(n.status).toBe(404);
    expect(await db('favorites')).toHaveLength(0);
  });

  it('исключили из пространства — его отметки больше не показывают чужие данные', async () => {
    await db('workspace_members').insert({
      workspace_id: anna.wsId,
      user_id: boris.user.id,
      role: 'viewer',
    });
    // viewer может отмечать: это личная отметка
    expect((await fav(boris.token, 'project', annaProject.id)).status).toBe(201);
    await db('workspace_members').where({ workspace_id: anna.wsId, user_id: boris.user.id }).del();

    expect(await favorites(boris.token)).toEqual({ projects: [], notes: [] });
  });

  it('чужие заметки: чтение, правка, удаление, превращение в проект, список → 404', async () => {
    const b = as(boris.token);
    const url = `/api/v1/notes/${annaNote.id}`;
    const responses = await Promise.all([
      b.get(url),
      b.patch(url).send({ title: 'Взломано' }),
      b.delete(url),
      b.post(`${url}/convert`),
      b.get(`/api/v1/workspaces/${anna.wsId}/notes`),
      b.post(`/api/v1/workspaces/${anna.wsId}/notes`).send({ title: 'Подкинул' }),
    ]);
    for (const res of responses) expect(res.status).toBe(404);
    expect((await db('notes').where({ id: annaNote.id }).first()).title).toBe('Секретная идея');
    expect(await db('projects')).toHaveLength(1);
  });

  it('нельзя привязать свою заметку к чужому проекту → 400 у поля', async () => {
    const b = as(boris.token);
    const created = await b
      .post(`/api/v1/workspaces/${boris.wsId}/notes`)
      .send({ title: 'Моя', projectId: annaProject.id });
    expect(created.status).toBe(400);
    expect(created.body.error.details[0].path).toBe('body.projectId');

    const own = (await b.post(`/api/v1/workspaces/${boris.wsId}/notes`).send({ title: 'Моя' }))
      .body;
    const patched = await b.patch(`/api/v1/notes/${own.id}`).send({ projectId: annaProject.id });
    expect(patched.status).toBe(400);
  });

  it('роли: viewer читает заметки, но не меняет; чужую заметку удаляет только admin', async () => {
    await db('workspace_members').insert({
      workspace_id: anna.wsId,
      user_id: boris.user.id,
      role: 'viewer',
    });
    const b = as(boris.token);
    const url = `/api/v1/notes/${annaNote.id}`;
    expect((await b.get(url)).status).toBe(200);
    expect((await b.patch(url).send({ title: 'x' })).status).toBe(403);
    expect((await b.post(`${url}/convert`)).status).toBe(403);

    await db('workspace_members').where({ user_id: boris.user.id }).update({ role: 'member' });
    expect((await b.delete(url)).status).toBe(403);
    await db('workspace_members').where({ user_id: boris.user.id }).update({ role: 'admin' });
    expect((await b.delete(url)).status).toBe(204);
  });

  it('без входа — 401', async () => {
    const { api } = await import('./helpers.js');
    expect((await api().get('/api/v1/favorites')).status).toBe(401);
    expect((await api().get(`/api/v1/notes/${annaNote.id}`)).status).toBe(401);
  });
});
