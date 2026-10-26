import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { as, setupUser } from './helpers.js';

let anna;
let project;
const api = () => as(anna.token);
const tasksUrl = (projectId = project.id) => `/api/v1/projects/${projectId}/tasks`;
const create = (data) => api().post(tasksUrl()).send(data);
const titles = (res) => res.body.items.map((t) => t.title);

beforeEach(async () => {
  anna = await setupUser();
  project = (
    await api()
      .post(`/api/v1/workspaces/${anna.wsId}/projects`)
      .send({ title: 'Альбом', type: 'music' })
  ).body;
});

describe('CRUD задач', () => {
  it('создание: минимум полей — остальное по умолчанию, позиция в конце колонки', async () => {
    const first = await create({ title: '  Сведение  ' });
    const second = await create({ title: 'Мастеринг' });

    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({
      projectId: project.id,
      title: 'Сведение',
      description: null,
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      assignee: null,
      completedAt: null,
      createdBy: anna.user.id,
      position: 1000,
    });
    expect(second.body.position).toBe(2000);
  });

  it('со всеми полями: дата строкой, исполнитель с именем', async () => {
    const res = await create({
      title: 'Обложка',
      description: 'Квадрат 3000×3000',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: '2026-11-15',
      assigneeId: anna.user.id,
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: 'in_progress',
      priority: 'urgent',
      dueDate: '2026-11-15',
      assignee: { id: anna.user.id, name: 'Анна' },
      position: 1000, // своя колонка — своя нумерация
    });
  });

  it('валидация — ошибки у полей', async () => {
    const res = await create({ title: '', status: 'later', priority: 'asap', dueDate: '15.11' });

    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toEqual(
      expect.arrayContaining(['body.title', 'body.status', 'body.priority', 'body.dueDate']),
    );
  });

  it('чтение, изменение, очистка полей, удаление', async () => {
    const task = (await create({ title: 'Текст', dueDate: '2026-11-01', priority: 'low' })).body;
    const url = `/api/v1/tasks/${task.id}`;

    expect((await api().get(url)).body.title).toBe('Текст');

    const patched = await api()
      .patch(url)
      .send({ title: 'Текст песни', priority: 'high', dueDate: '', description: 'Куплет' });
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({
      title: 'Текст песни',
      priority: 'high',
      dueDate: null,
      description: 'Куплет',
    });

    expect((await api().patch(url).send({})).status).toBe(400);

    expect((await api().delete(url)).status).toBe(204);
    expect((await api().get(url)).status).toBe(404);
  });

  it('смена статуса через PATCH переносит задачу в конец новой колонки', async () => {
    await create({ title: 'Уже в работе', status: 'in_progress' });
    const task = (await create({ title: 'Новая' })).body;

    const res = await api().patch(`/api/v1/tasks/${task.id}`).send({ status: 'in_progress' });
    expect(res.body).toMatchObject({ status: 'in_progress', position: 2000 });
  });

  it('удаление проекта удаляет его задачи', async () => {
    await create({ title: 'Одна' });
    await api().delete(`/api/v1/projects/${project.id}`);
    expect(await db('tasks')).toHaveLength(0);
  });
});

describe('completed_at', () => {
  const moveTo = (id, status) =>
    api().patch(`/api/v1/tasks/${id}/move`).send({ status, position: 0 });

  it('ставится при переходе в done и очищается при выходе — и через move, и через PATCH', async () => {
    const task = (await create({ title: 'Финал' })).body;
    const url = `/api/v1/tasks/${task.id}`;

    const done = (await moveTo(task.id, 'done')).body;
    expect(done.completedAt).not.toBeNull();

    // Перемещение внутри done — время выполнения не меняется
    const again = (await moveTo(task.id, 'done')).body;
    expect(again.completedAt).toBe(done.completedAt);

    expect((await moveTo(task.id, 'review')).body.completedAt).toBeNull();

    expect((await api().patch(url).send({ status: 'done' })).body.completedAt).not.toBeNull();
    // Правка других полей не трогает completed_at
    expect((await api().patch(url).send({ title: 'Финал!' })).body.completedAt).not.toBeNull();
    expect((await api().patch(url).send({ status: 'todo' })).body.completedAt).toBeNull();
  });

  it('задача, созданная сразу в done, — уже выполнена', async () => {
    expect((await create({ title: 'Было', status: 'done' })).body.completedAt).not.toBeNull();
  });
});

describe('Фильтры', () => {
  beforeEach(async () => {
    await create({ title: 'A', status: 'todo', priority: 'low' });
    await create({ title: 'B', status: 'in_progress', priority: 'high' });
    await create({ title: 'C', status: 'done', priority: 'high' });
    await create({ title: 'D', status: 'todo', priority: 'urgent' });
  });

  it('список проекта: по колонкам, внутри — по позиции', async () => {
    expect(titles(await api().get(tasksUrl()))).toEqual(['A', 'D', 'B', 'C']);
  });

  it('status и priority — одно значение или несколько через запятую', async () => {
    expect(titles(await api().get(`${tasksUrl()}?status=todo`))).toEqual(['A', 'D']);
    expect(titles(await api().get(`${tasksUrl()}?priority=high`))).toEqual(['B', 'C']);
    expect(titles(await api().get(`${tasksUrl()}?status=todo,done&priority=high,urgent`))).toEqual([
      'D',
      'C',
    ]);
    expect((await api().get(`${tasksUrl()}?status=later`)).status).toBe(400);
  });
});

describe('Задачи пространства (Мои задачи, календарь)', () => {
  let other;

  beforeEach(async () => {
    other = (
      await api()
        .post(`/api/v1/workspaces/${anna.wsId}/projects`)
        .send({ title: 'Клип', type: 'video' })
    ).body;
    const me = anna.user.id;
    await create({ title: 'Без даты', assigneeId: me });
    await create({ title: 'Ноябрь', dueDate: '2026-11-10', assigneeId: me });
    await create({ title: 'Октябрь', dueDate: '2026-10-20', status: 'done', assigneeId: me });
    await create({ title: 'Ничья', dueDate: '2026-11-05' });
    await api()
      .post(tasksUrl(other.id))
      .send({ title: 'Монтаж', dueDate: '2026-11-10', priority: 'urgent', assigneeId: me });
  });

  const wsTasks = (query = '') => api().get(`/api/v1/workspaces/${anna.wsId}/tasks${query}`);

  it('все задачи пространства: ближайшие дедлайны первыми, важные выше, без даты — в конце', async () => {
    const res = await wsTasks();
    expect(res.body.total).toBe(5);
    expect(titles(res)).toEqual(['Октябрь', 'Ничья', 'Монтаж', 'Ноябрь', 'Без даты']);
    // У каждой задачи — её проект
    expect(res.body.items[2].project).toEqual({
      id: other.id,
      title: 'Клип',
      type: 'video',
      color: null,
    });
  });

  it('assignee=me, диапазон дат, статус', async () => {
    expect(titles(await wsTasks('?assignee=me'))).not.toContain('Ничья');
    expect(titles(await wsTasks('?due_from=2026-11-01&due_to=2026-11-10'))).toEqual([
      'Ничья',
      'Монтаж',
      'Ноябрь',
    ]);
    expect(titles(await wsTasks('?assignee=me&status=todo,in_progress,review'))).toEqual([
      'Монтаж',
      'Ноябрь',
      'Без даты',
    ]);
  });

  it('пагинация и ошибки параметров', async () => {
    const page = await wsTasks('?limit=2&offset=1');
    expect(page.body).toMatchObject({ total: 5, limit: 2, offset: 1 });
    expect(titles(page)).toEqual(['Ничья', 'Монтаж']);

    expect((await wsTasks('?assignee=boris')).status).toBe(400);
    expect((await wsTasks('?due_from=2026-12-01&due_to=2026-11-01')).status).toBe(400);
  });

  it('задачи архивных проектов не показываются', async () => {
    await api().post(`/api/v1/projects/${other.id}/archive`);
    expect(titles(await wsTasks())).not.toContain('Монтаж');
  });
});

describe('Прогресс проекта и архив', () => {
  it('progress и taskCounts считаются по задачам — в карточке и в списке', async () => {
    const tasks = [];
    for (const title of ['1', '2', '3', '4']) tasks.push((await create({ title })).body);
    await api().patch(`/api/v1/tasks/${tasks[0].id}/move`).send({ status: 'done', position: 0 });

    const one = (await api().get(`/api/v1/projects/${project.id}`)).body;
    expect(one).toMatchObject({ progress: 25, taskCounts: { total: 4, done: 1 } });

    const list = (await api().get(`/api/v1/workspaces/${anna.wsId}/projects`)).body;
    expect(list.items[0]).toMatchObject({ progress: 25, taskCounts: { total: 4, done: 1 } });
  });

  it('в архивном проекте задачи только читаются: изменения → 409 PROJECT_ARCHIVED', async () => {
    const task = (await create({ title: 'Старая' })).body;
    await api().post(`/api/v1/projects/${project.id}/archive`);

    const url = `/api/v1/tasks/${task.id}`;
    const responses = await Promise.all([
      create({ title: 'Новая' }),
      api().patch(url).send({ title: 'Иначе' }),
      api().patch(`${url}/move`).send({ status: 'done', position: 0 }),
      api().delete(url),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PROJECT_ARCHIVED');
    }
    expect((await api().get(tasksUrl())).body.items).toHaveLength(1);

    // После восстановления — снова можно
    await api().post(`/api/v1/projects/${project.id}/restore`);
    expect((await create({ title: 'Новая' })).status).toBe(201);
  });
});
