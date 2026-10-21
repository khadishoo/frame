import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { as, setupUser } from './helpers.js';

// Анна — владелица своего пространства и данных; Борис — посторонний (или участник с ролью)
let anna;
let boris;
let annaProject;
let annaCategory;
let annaTag;

beforeEach(async () => {
  anna = await setupUser();
  boris = await setupUser({ email: 'boris@example.com', name: 'Борис' });

  const base = `/api/v1/workspaces/${anna.wsId}`;
  annaCategory = (await as(anna.token).get(`${base}/categories`)).body.items[0];
  annaTag = (await as(anna.token).post(`${base}/tags`).send({ name: 'секрет' })).body;
  annaProject = (
    await as(anna.token)
      .post(`${base}/projects`)
      .send({ title: 'Личный дневник', type: 'script', tagIds: [annaTag.id] })
  ).body;
});

describe('Посторонний пользователь получает 404 на всё чужое', () => {
  it('проект: прочитать, изменить, удалить, архивировать, теги', async () => {
    const b = as(boris.token);
    const url = `/api/v1/projects/${annaProject.id}`;
    const responses = await Promise.all([
      b.get(url),
      b.patch(url).send({ title: 'Взломано' }),
      b.delete(url),
      b.post(`${url}/archive`),
      b.post(`${url}/restore`),
      b.put(`${url}/tags`).send({ tagIds: [] }),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Проект не найден');
    }
    // Проект не изменился
    const fresh = (await as(anna.token).get(url)).body;
    expect(fresh).toMatchObject({ title: 'Личный дневник', archivedAt: null });
    expect(fresh.tags).toHaveLength(1);
  });

  it('пространство: список и создание проектов, категории, теги', async () => {
    const b = as(boris.token);
    const base = `/api/v1/workspaces/${anna.wsId}`;
    const responses = await Promise.all([
      b.get(`${base}/projects`),
      b.post(`${base}/projects`).send({ title: 'Подкинул', type: 'art' }),
      b.get(`${base}/categories`),
      b.post(`${base}/categories`).send({ name: 'Моя' }),
      b.get(`${base}/tags`),
      b.post(`${base}/tags`).send({ name: 'мой' }),
    ]);
    for (const res of responses) expect(res.status).toBe(404);
    expect(await db('projects').where({ workspace_id: anna.wsId })).toHaveLength(1);
  });

  it('категория и тег: изменить и удалить', async () => {
    const b = as(boris.token);
    const responses = await Promise.all([
      b.patch(`/api/v1/categories/${annaCategory.id}`).send({ name: 'Моя' }),
      b.delete(`/api/v1/categories/${annaCategory.id}`),
      b.patch(`/api/v1/tags/${annaTag.id}`).send({ name: 'мой' }),
      b.delete(`/api/v1/tags/${annaTag.id}`),
    ]);
    for (const res of responses) expect(res.status).toBe(404);
    expect(await db('categories').where({ id: annaCategory.id }).first()).toMatchObject({
      name: annaCategory.name,
    });
    expect(await db('tags').where({ id: annaTag.id }).first()).toBeDefined();
  });

  it('некорректный id в адресе — тоже 404, а не 500', async () => {
    const b = as(boris.token);
    expect((await b.get('/api/v1/projects/not-a-uuid')).status).toBe(404);
    expect((await b.get('/api/v1/workspaces/123/projects')).status).toBe(404);
    expect((await b.patch('/api/v1/tags/xyz').send({ name: 'a' })).status).toBe(404);
  });

  it('без входа — 401', async () => {
    const { api } = await import('./helpers.js');
    expect((await api().get(`/api/v1/projects/${annaProject.id}`)).status).toBe(401);
    expect((await api().get(`/api/v1/workspaces/${anna.wsId}/projects`)).status).toBe(401);
  });
});

describe('Нельзя привязать к своему проекту чужую категорию или тег', () => {
  it('при создании проекта', async () => {
    const res = await as(boris.token)
      .post(`/api/v1/workspaces/${boris.wsId}/projects`)
      .send({ title: 'Мой', type: 'art', categoryId: annaCategory.id, tagIds: [annaTag.id] });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('body.categoryId');
    expect(await db('projects').where({ workspace_id: boris.wsId })).toHaveLength(0);
  });

  it('чужой тег при создании', async () => {
    const res = await as(boris.token)
      .post(`/api/v1/workspaces/${boris.wsId}/projects`)
      .send({ title: 'Мой', type: 'art', tagIds: [annaTag.id] });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('body.tagIds');
  });

  it('при изменении проекта и замене тегов', async () => {
    const b = as(boris.token);
    const own = (
      await b.post(`/api/v1/workspaces/${boris.wsId}/projects`).send({ title: 'Мой', type: 'art' })
    ).body;

    const patch = await b.patch(`/api/v1/projects/${own.id}`).send({ categoryId: annaCategory.id });
    expect(patch.status).toBe(400);
    expect(patch.body.error.details[0].path).toBe('body.categoryId');

    const putTags = await b.put(`/api/v1/projects/${own.id}/tags`).send({ tagIds: [annaTag.id] });
    expect(putTags.status).toBe(400);

    expect(await db('project_tags').where({ project_id: own.id })).toHaveLength(0);
  });
});

describe('Роли в общем пространстве', () => {
  // Совместных пространств ещё нет (v1.2) — добавляем Бориса в пространство Анны напрямую
  const addBoris = (role) =>
    db('workspace_members').insert({ workspace_id: anna.wsId, user_id: boris.id, role });

  beforeEach(() => {
    boris.id = boris.user.id;
  });

  it('viewer читает, но не создаёт и не меняет → 403', async () => {
    await addBoris('viewer');
    const b = as(boris.token);
    const base = `/api/v1/workspaces/${anna.wsId}`;

    expect((await b.get(`${base}/projects`)).body.total).toBe(1);
    expect((await b.get(`/api/v1/projects/${annaProject.id}`)).status).toBe(200);
    expect((await b.post(`${base}/projects`).send({ title: 'X', type: 'art' })).status).toBe(403);
    expect((await b.patch(`/api/v1/projects/${annaProject.id}`).send({ title: 'X' })).status).toBe(
      403,
    );
    expect((await b.post(`${base}/tags`).send({ name: 'x' })).status).toBe(403);
    expect((await b.delete(`/api/v1/categories/${annaCategory.id}`)).status).toBe(403);
  });

  it('member создаёт и удаляет свои проекты, но не чужие', async () => {
    await addBoris('member');
    const b = as(boris.token);
    const own = (
      await b.post(`/api/v1/workspaces/${anna.wsId}/projects`).send({ title: 'Мой', type: 'art' })
    ).body;

    expect((await b.delete(`/api/v1/projects/${annaProject.id}`)).status).toBe(403);
    expect((await b.delete(`/api/v1/projects/${own.id}`)).status).toBe(204);
  });

  it('admin может удалить чужой проект', async () => {
    await addBoris('admin');
    expect((await as(boris.token).delete(`/api/v1/projects/${annaProject.id}`)).status).toBe(204);
  });
});

describe('Каскады', () => {
  it('удаление аккаунта удаляет проекты, теги и категории его личного пространства', async () => {
    await as(anna.token).delete('/api/v1/users/me').send({ password: 'correct-horse-42' });

    for (const table of ['projects', 'tags', 'categories']) {
      expect(await db(table).where({ workspace_id: anna.wsId })).toHaveLength(0);
    }
    expect(await db('project_tags').where({ project_id: annaProject.id })).toHaveLength(0);
  });
});
