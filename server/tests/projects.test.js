import { beforeEach, describe, expect, it } from 'vitest';
import { as, setupUser } from './helpers.js';

let anna;
const api = () => as(anna.token);
const projectsUrl = () => `/api/v1/workspaces/${anna.wsId}/projects`;
const create = (data) => api().post(projectsUrl()).send(data);

const firstCategory = async () =>
  (await api().get(`/api/v1/workspaces/${anna.wsId}/categories`)).body.items[0];
const createTag = async (name) =>
  (await api().post(`/api/v1/workspaces/${anna.wsId}/tags`).send({ name })).body;

beforeEach(async () => {
  anna = await setupUser();
});

describe('Создание проекта', () => {
  it('минимум полей — остальное по умолчанию', async () => {
    const res = await create({ title: '  Короткий метр  ', type: 'video' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      workspaceId: anna.wsId,
      title: 'Короткий метр',
      type: 'video',
      status: 'active',
      visibility: 'private',
      color: null,
      description: null,
      startDate: null,
      dueDate: null,
      archivedAt: null,
      createdBy: anna.user.id,
      category: null,
      tags: [],
      progress: 0,
      taskCounts: { total: 0, done: 0 },
    });
  });

  it('со всеми полями: категория, теги, даты (строкой, без сдвига дня)', async () => {
    const category = await firstCategory();
    const tag = await createTag('синтвейв');

    const res = await create({
      title: 'Альбом «Север»',
      type: 'music',
      status: 'idea',
      description: 'Восемь треков о зиме',
      color: 'blue',
      visibility: 'workspace',
      categoryId: category.id,
      tagIds: [tag.id, tag.id], // повтор игнорируется
      startDate: '2026-11-01',
      dueDate: '2026-12-31',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: 'idea',
      color: 'blue',
      visibility: 'workspace',
      startDate: '2026-11-01',
      dueDate: '2026-12-31',
      category: { id: category.id, name: 'Для себя', color: 'violet' },
      tags: [{ id: tag.id, name: 'синтвейв', color: 'gray' }],
    });
  });

  it('валидация: название, тип, даты, цвет — ошибки у полей', async () => {
    const res = await create({
      title: '',
      type: 'cooking',
      color: '#fff',
      startDate: '2026-12-01',
      dueDate: '01.12.2026',
    });

    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toEqual(
      expect.arrayContaining(['body.title', 'body.type', 'body.color', 'body.dueDate']),
    );
  });

  it('дедлайн раньше начала → 400 у поля dueDate', async () => {
    const res = await create({
      title: 'X',
      type: 'art',
      startDate: '2026-12-10',
      dueDate: '2026-12-01',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { path: 'body.dueDate', message: 'Дедлайн не может быть раньше даты начала' },
    ]);
  });
});

describe('Чтение, изменение, удаление', () => {
  it('GET /projects/:id', async () => {
    const { id } = (await create({ title: 'Серия фото', type: 'photo' })).body;
    const res = await api().get(`/api/v1/projects/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, title: 'Серия фото' });
  });

  it('PATCH меняет только переданные поля; категорию можно снять (null)', async () => {
    const category = await firstCategory();
    const { id, updatedAt } = (
      await create({
        title: 'Игра',
        type: 'dev',
        categoryId: category.id,
        description: 'Платформер',
      })
    ).body;

    const res = await api()
      .patch(`/api/v1/projects/${id}`)
      .send({ status: 'paused', categoryId: null, dueDate: '2027-01-15' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      title: 'Игра',
      description: 'Платформер',
      status: 'paused',
      category: null,
      dueDate: '2027-01-15',
    });
    expect(new Date(res.body.updatedAt) >= new Date(updatedAt)).toBe(true);
  });

  it('PATCH: дедлайн раньше уже сохранённой даты начала → 400', async () => {
    const { id } = (await create({ title: 'X', type: 'art', startDate: '2026-12-10' })).body;
    const res = await api().patch(`/api/v1/projects/${id}`).send({ dueDate: '2026-12-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('body.dueDate');
  });

  it('PATCH без полей → 400', async () => {
    const { id } = (await create({ title: 'X', type: 'art' })).body;
    expect((await api().patch(`/api/v1/projects/${id}`).send({})).status).toBe(400);
  });

  it('DELETE удаляет проект', async () => {
    const { id } = (await create({ title: 'X', type: 'art' })).body;
    expect((await api().delete(`/api/v1/projects/${id}`)).status).toBe(204);
    expect((await api().get(`/api/v1/projects/${id}`)).status).toBe(404);
  });
});

describe('Архив', () => {
  it('архивировать → пропал из списка, есть в status=archived; восстановить → прежний статус', async () => {
    const { id } = (await create({ title: 'Готовый клип', type: 'video', status: 'completed' }))
      .body;

    const archived = await api().post(`/api/v1/projects/${id}/archive`);
    expect(archived.status).toBe(200);
    expect(archived.body.archivedAt).not.toBeNull();
    expect((await api().get(projectsUrl())).body.total).toBe(0);
    expect((await api().get(`${projectsUrl()}?status=archived`)).body.items[0].id).toBe(id);

    const restored = await api().post(`/api/v1/projects/${id}/restore`);
    expect(restored.body).toMatchObject({ archivedAt: null, status: 'completed' });
    expect((await api().get(projectsUrl())).body.total).toBe(1);
  });
});

describe('PUT /projects/:id/tags', () => {
  it('заменяет набор тегов целиком; пустой список — снять все', async () => {
    const [a, b, c] = await Promise.all(['a', 'b', 'c'].map(createTag));
    const { id } = (await create({ title: 'X', type: 'art', tagIds: [a.id, b.id] })).body;

    const res = await api()
      .put(`/api/v1/projects/${id}/tags`)
      .send({ tagIds: [b.id, c.id] });
    expect(res.status).toBe(200);
    expect(res.body.tags.map((t) => t.name)).toEqual(['b', 'c']);

    const cleared = await api().put(`/api/v1/projects/${id}/tags`).send({ tagIds: [] });
    expect(cleared.body.tags).toEqual([]);
  });

  it('несуществующий тег → 400, старые теги не тронуты (транзакция)', async () => {
    const a = await createTag('a');
    const { id } = (await create({ title: 'X', type: 'art', tagIds: [a.id] })).body;

    const res = await api()
      .put(`/api/v1/projects/${id}/tags`)
      .send({ tagIds: [a.id, '00000000-0000-4000-8000-000000000000'] });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('body.tagIds');
    expect((await api().get(`/api/v1/projects/${id}`)).body.tags.map((t) => t.name)).toEqual(['a']);
  });
});
