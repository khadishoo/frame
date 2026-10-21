import { beforeEach, describe, expect, it } from 'vitest';
import { as, setupUser } from './helpers.js';

let anna;
const api = () => as(anna.token);
const categoriesUrl = () => `/api/v1/workspaces/${anna.wsId}/categories`;
const tagsUrl = () => `/api/v1/workspaces/${anna.wsId}/tags`;

beforeEach(async () => {
  anna = await setupUser();
});

describe('Категории', () => {
  it('у нового пространства — 4 категории по умолчанию', async () => {
    const res = await api().get(categoriesUrl());

    expect(res.status).toBe(200);
    expect(res.body.items.map((c) => c.name)).toEqual(['Для себя', 'Работа', 'Заказы', 'Учёба']);
    expect(res.body.items[0]).toMatchObject({ color: 'violet', projectCount: 0 });
  });

  it('создать, переименовать, сменить цвет', async () => {
    const created = await api()
      .post(categoriesUrl())
      .send({ name: '  Фестивали  ', color: 'pink' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: 'Фестивали', color: 'pink', projectCount: 0 });

    const renamed = await api()
      .patch(`/api/v1/categories/${created.body.id}`)
      .send({ name: 'Конкурсы', color: 'teal' });
    expect(renamed.status).toBe(200);
    expect(renamed.body).toMatchObject({ name: 'Конкурсы', color: 'teal' });
  });

  it('цвет по умолчанию — gray; неизвестный цвет → 400', async () => {
    expect((await api().post(categoriesUrl()).send({ name: 'Серое' })).body.color).toBe('gray');
    const bad = await api().post(categoriesUrl()).send({ name: 'Ой', color: '#ff0000' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.details[0].path).toBe('body.color');
  });

  it('дубликат названия (без учёта регистра) → 409 у поля name', async () => {
    const res = await api().post(categoriesUrl()).send({ name: 'работа' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_EXISTS');
    expect(res.body.error.details[0].path).toBe('body.name');
  });

  it('пустое или слишком длинное название → 400', async () => {
    expect((await api().post(categoriesUrl()).send({ name: '   ' })).status).toBe(400);
    expect(
      (
        await api()
          .post(categoriesUrl())
          .send({ name: 'я'.repeat(41) })
      ).status,
    ).toBe(400);
  });

  it('удаление категории не удаляет проекты — у них просто нет категории', async () => {
    const [category] = (await api().get(categoriesUrl())).body.items;
    const project = await api()
      .post(`/api/v1/workspaces/${anna.wsId}/projects`)
      .send({ title: 'Альбом', type: 'music', categoryId: category.id });
    expect(project.body.category).toMatchObject({ id: category.id, name: 'Для себя' });
    expect((await api().get(categoriesUrl())).body.items[0].projectCount).toBe(1);

    expect((await api().delete(`/api/v1/categories/${category.id}`)).status).toBe(204);

    const after = await api().get(`/api/v1/projects/${project.body.id}`);
    expect(after.status).toBe(200);
    expect(after.body.category).toBeNull();
  });
});

describe('Теги', () => {
  it('создать, список со счётчиком проектов, переименовать, удалить', async () => {
    const tag = (await api().post(tagsUrl()).send({ name: 'лофи', color: 'teal' })).body;
    await api()
      .post(`/api/v1/workspaces/${anna.wsId}/projects`)
      .send({ title: 'Бит', type: 'music', tagIds: [tag.id] });

    const list = await api().get(tagsUrl());
    expect(list.body.items).toEqual([{ id: tag.id, name: 'лофи', color: 'teal', projectCount: 1 }]);

    expect((await api().patch(`/api/v1/tags/${tag.id}`).send({ name: 'lo-fi' })).body.name).toBe(
      'lo-fi',
    );
    expect((await api().delete(`/api/v1/tags/${tag.id}`)).status).toBe(204);
    expect((await api().get(tagsUrl())).body.items).toEqual([]);
  });

  it('дубликат тега → 409 TAG_EXISTS', async () => {
    await api().post(tagsUrl()).send({ name: 'Скетч' });
    const res = await api().post(tagsUrl()).send({ name: 'СКЕТЧ' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('TAG_EXISTS');
  });

  it('архивный проект не учитывается в счётчике', async () => {
    const tag = (await api().post(tagsUrl()).send({ name: 'черновик' })).body;
    const project = (
      await api()
        .post(`/api/v1/workspaces/${anna.wsId}/projects`)
        .send({ title: 'Эскиз', type: 'art', tagIds: [tag.id] })
    ).body;
    await api().post(`/api/v1/projects/${project.id}/archive`);

    expect((await api().get(tagsUrl())).body.items[0].projectCount).toBe(0);
  });
});
