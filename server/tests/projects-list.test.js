import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { as, setupUser } from './helpers.js';

let anna;
let tags;
let categories;
const api = () => as(anna.token);
const list = (query = '') => api().get(`/api/v1/workspaces/${anna.wsId}/projects${query}`);
const titles = (res) => res.body.items.map((p) => p.title);

beforeEach(async () => {
  anna = await setupUser();
  const base = `/api/v1/workspaces/${anna.wsId}`;
  categories = (await api().get(`${base}/categories`)).body.items;
  const [lofi, sketch] = await Promise.all(
    ['лофи', 'скетч'].map(async (name) => (await api().post(`${base}/tags`).send({ name })).body),
  );
  tags = { lofi, sketch };

  // Создаём по очереди — у проектов разный updated_at
  const data = [
    {
      title: 'Альбом «Север»',
      type: 'music',
      status: 'active',
      dueDate: '2026-12-31',
      categoryId: categories[0].id,
      tagIds: [lofi.id],
    },
    {
      title: 'Комикс про кота',
      type: 'art',
      status: 'idea',
      dueDate: '2026-11-15',
      tagIds: [sketch.id],
    },
    {
      title: 'Бит для друга',
      type: 'music',
      status: 'paused',
      categoryId: categories[2].id,
      tagIds: [lofi.id, sketch.id],
    },
    { title: 'Сайт-портфолио', type: 'dev', status: 'completed', dueDate: '2026-10-30' },
    { title: 'Скидка 50% — лендинг', type: 'dev', status: 'active' },
  ];
  for (const project of data) {
    await api().post(`${base}/projects`).send(project);
  }
});

describe('Список проектов: фильтры', () => {
  it('без фильтров — все, свежие первыми; total', async () => {
    const res = await list();
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(titles(res)[0]).toBe('Скидка 50% — лендинг');
    expect(res.body).toMatchObject({ limit: 20, offset: 0 });
  });

  it('по типу и статусу', async () => {
    expect(titles(await list('?type=music')).sort()).toEqual(['Альбом «Север»', 'Бит для друга']);
    expect(titles(await list('?status=active')).sort()).toEqual([
      'Альбом «Север»',
      'Скидка 50% — лендинг',
    ]);
    expect(titles(await list('?type=music&status=paused'))).toEqual(['Бит для друга']);
  });

  it('по категории и «без категории»', async () => {
    expect(titles(await list(`?category=${categories[0].id}`))).toEqual(['Альбом «Север»']);
    expect((await list('?category=none')).body.total).toBe(3);
  });

  it('по тегу', async () => {
    expect(titles(await list(`?tag=${tags.lofi.id}`)).sort()).toEqual([
      'Альбом «Север»',
      'Бит для друга',
    ]);
  });

  it('поиск по названию: без учёта регистра, % и _ — обычные символы', async () => {
    expect(titles(await list(`?q=${encodeURIComponent('АЛЬБОМ')}`))).toEqual(['Альбом «Север»']);
    expect(titles(await list(`?q=${encodeURIComponent('50%')}`))).toEqual(['Скидка 50% — лендинг']);
    // «%» без экранирования совпал бы со всем
    expect((await list(`?q=${encodeURIComponent('%')}`)).body.total).toBe(1);
    expect((await list('?q=nothing-like-this')).body.total).toBe(0);
  });

  it('неверные параметры → 400', async () => {
    expect((await list('?status=done')).status).toBe(400);
    expect((await list('?category=abc')).status).toBe(400);
    expect((await list('?sort=random')).status).toBe(400);
    expect((await list('?limit=1000')).status).toBe(400);
  });
});

describe('Список проектов: сортировка и пагинация', () => {
  it('по названию (asc и desc)', async () => {
    const asc = titles(await list('?sort=title'));
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b, 'ru')));
    expect(titles(await list('?sort=title&order=desc'))).toEqual([...asc].reverse());
  });

  it('по дедлайну: ближайшие первыми, без дедлайна — в конце', async () => {
    expect(titles(await list('?sort=due_date'))).toEqual([
      'Сайт-портфолио',
      'Комикс про кота',
      'Альбом «Север»',
      expect.any(String),
      expect.any(String),
    ]);
  });

  it('limit/offset + total не зависит от страницы', async () => {
    const page1 = await list('?sort=title&limit=2');
    const page2 = await list('?sort=title&limit=2&offset=2');
    const page3 = await list('?sort=title&limit=2&offset=4');

    expect([page1, page2, page3].map((p) => p.body.total)).toEqual([5, 5, 5]);
    expect([page1, page2, page3].map((p) => p.body.items.length)).toEqual([2, 2, 1]);
    const all = [...titles(page1), ...titles(page2), ...titles(page3)];
    expect(new Set(all).size).toBe(5);
  });

  it('смена тегов поднимает проект наверх «недавно изменённых»', async () => {
    const oldest = (await list('?sort=updated_at&order=asc')).body.items[0];
    await api()
      .put(`/api/v1/projects/${oldest.id}/tags`)
      .send({ tagIds: [tags.sketch.id] });
    expect((await list()).body.items[0].id).toBe(oldest.id);
  });

  it('один запрос на теги для всей страницы (без N+1)', async () => {
    const queries = [];
    const listener = (q) => queries.push(q.sql);
    db.on('query', listener);
    await list();
    db.off('query', listener);
    expect(queries.filter((sql) => sql.includes('project_tags')).length).toBeLessThanOrEqual(1);
  });
});
