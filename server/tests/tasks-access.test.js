import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { api as anonymous, as, setupUser } from './helpers.js';

// Анна — владелица проекта и задачи; Борис — посторонний (или участник с ролью)
let anna;
let boris;
let annaProject;
let annaTask;

beforeEach(async () => {
  anna = await setupUser();
  boris = await setupUser({ email: 'boris@example.com', name: 'Борис' });

  annaProject = (
    await as(anna.token)
      .post(`/api/v1/workspaces/${anna.wsId}/projects`)
      .send({ title: 'Личный дневник', type: 'script' })
  ).body;
  annaTask = (
    await as(anna.token)
      .post(`/api/v1/projects/${annaProject.id}/tasks`)
      .send({ title: 'Секретная глава', assigneeId: anna.user.id })
  ).body;
});

describe('Посторонний получает 404 на чужие задачи', () => {
  it('задача: прочитать, изменить, переместить, удалить', async () => {
    const b = as(boris.token);
    const url = `/api/v1/tasks/${annaTask.id}`;
    const responses = await Promise.all([
      b.get(url),
      b.patch(url).send({ title: 'Взломано' }),
      b.patch(`${url}/move`).send({ status: 'done', position: 0 }),
      b.delete(url),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Задача не найдена');
    }
    expect(await db('tasks').where({ id: annaTask.id }).first()).toMatchObject({
      title: 'Секретная глава',
      status: 'todo',
    });
  });

  it('нельзя посмотреть задачи чужого проекта и создать в нём задачу', async () => {
    const b = as(boris.token);
    const url = `/api/v1/projects/${annaProject.id}/tasks`;
    expect((await b.get(url)).status).toBe(404);
    expect((await b.post(url).send({ title: 'Подкинул' })).status).toBe(404);
    expect(await db('tasks')).toHaveLength(1);
  });

  it('нельзя получить задачи чужого пространства', async () => {
    const res = await as(boris.token).get(`/api/v1/workspaces/${anna.wsId}/tasks`);
    expect(res.status).toBe(404);
  });

  it('в своём пространстве видны только свои задачи', async () => {
    const res = await as(boris.token).get(`/api/v1/workspaces/${boris.wsId}/tasks`);
    expect(res.body).toMatchObject({ items: [], total: 0 });
  });

  it('кривой id — 404, без входа — 401', async () => {
    expect((await as(boris.token).get('/api/v1/tasks/not-a-uuid')).status).toBe(404);
    expect((await anonymous().get(`/api/v1/tasks/${annaTask.id}`)).status).toBe(401);
  });
});

describe('Исполнитель — только участник пространства', () => {
  it('нельзя назначить постороннего ни при создании, ни при изменении', async () => {
    const a = as(anna.token);
    const created = await a
      .post(`/api/v1/projects/${annaProject.id}/tasks`)
      .send({ title: 'Для Бориса', assigneeId: boris.user.id });
    expect(created.status).toBe(400);
    expect(created.body.error.details[0].path).toBe('body.assigneeId');

    const patched = await a
      .patch(`/api/v1/tasks/${annaTask.id}`)
      .send({ assigneeId: boris.user.id });
    expect(patched.status).toBe(400);
    expect(patched.body.error.details[0].path).toBe('body.assigneeId');

    // Несуществующий пользователь — та же ошибка
    const ghost = await a
      .patch(`/api/v1/tasks/${annaTask.id}`)
      .send({ assigneeId: '00000000-0000-4000-8000-000000000000' });
    expect(ghost.status).toBe(400);
  });

  it('участника пространства назначить можно; null снимает исполнителя', async () => {
    await db('workspace_members').insert({
      workspace_id: anna.wsId,
      user_id: boris.user.id,
      role: 'member',
    });
    const url = `/api/v1/tasks/${annaTask.id}`;

    const res = await as(anna.token).patch(url).send({ assigneeId: boris.user.id });
    expect(res.status).toBe(200);
    expect(res.body.assignee).toMatchObject({ id: boris.user.id, name: 'Борис' });

    // «Мои задачи» Бориса в пространстве Анны
    const mine = await as(boris.token).get(`/api/v1/workspaces/${anna.wsId}/tasks?assignee=me`);
    expect(mine.body.items.map((t) => t.id)).toEqual([annaTask.id]);

    expect((await as(anna.token).patch(url).send({ assigneeId: null })).body.assignee).toBeNull();
  });

  it('удаление аккаунта исполнителя не удаляет задачу', async () => {
    await db('workspace_members').insert({
      workspace_id: anna.wsId,
      user_id: boris.user.id,
      role: 'member',
    });
    await as(anna.token).patch(`/api/v1/tasks/${annaTask.id}`).send({ assigneeId: boris.user.id });
    await as(boris.token).delete('/api/v1/users/me').send({ password: 'correct-horse-42' });

    const task = (await as(anna.token).get(`/api/v1/tasks/${annaTask.id}`)).body;
    expect(task.assignee).toBeNull();
  });
});

describe('Роли', () => {
  it('viewer читает задачи, но не создаёт, не меняет и не двигает → 403', async () => {
    await db('workspace_members').insert({
      workspace_id: anna.wsId,
      user_id: boris.user.id,
      role: 'viewer',
    });
    const b = as(boris.token);
    const url = `/api/v1/tasks/${annaTask.id}`;

    expect((await b.get(url)).status).toBe(200);
    expect((await b.get(`/api/v1/projects/${annaProject.id}/tasks`)).body.items).toHaveLength(1);

    const responses = await Promise.all([
      b.post(`/api/v1/projects/${annaProject.id}/tasks`).send({ title: 'X' }),
      b.patch(url).send({ title: 'X' }),
      b.patch(`${url}/move`).send({ status: 'done', position: 0 }),
      b.delete(url),
    ]);
    for (const res of responses) expect(res.status).toBe(403);
  });
});

describe('Каскады', () => {
  it('удаление аккаунта удаляет его проекты вместе с задачами (автор = исполнитель)', async () => {
    // У annaTask Анна и автор, и исполнитель — две ссылки на одного пользователя
    const res = await as(anna.token)
      .delete('/api/v1/users/me')
      .send({ password: 'correct-horse-42' });

    expect(res.status).toBe(204);
    expect(await db('projects').where({ id: annaProject.id })).toHaveLength(0);
    expect(await db('tasks')).toHaveLength(0);
  });
});
