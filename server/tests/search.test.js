import { beforeEach, describe, expect, it } from 'vitest';
import { snippetAround } from '../src/modules/search/search.service.js';
import { as, setupUser } from './helpers.js';

let anna;
let boris;
const base = () => `/api/v1/workspaces/${anna.wsId}`;
const search = (q, token = anna.token, wsId = anna.wsId) =>
  as(token).get(`/api/v1/workspaces/${wsId}/search?q=${encodeURIComponent(q)}`);
const titles = (items) => items.map((i) => i.title);

beforeEach(async () => {
  anna = await setupUser();
  boris = await setupUser({ email: 'boris@example.com', name: 'Борис' });
  const a = as(anna.token);

  const clip = (
    await a.post(`${base()}/projects`).send({
      title: 'Клип для группы',
      type: 'video',
      description: 'Снимаем на крыше, нужен свет и дым-машина',
    })
  ).body;
  await a.post(`${base()}/projects`).send({ title: 'Свет в окне', type: 'photo' });
  await a.post(`${base()}/projects`).send({ title: 'Скидка 50% на свет', type: 'other' });
  const archived = (await a.post(`${base()}/projects`).send({ title: 'Старый свет', type: 'art' }))
    .body;

  await a.post(`/api/v1/projects/${clip.id}/tasks`).send({ title: 'Арендовать свет' });
  await a
    .post(`/api/v1/projects/${clip.id}/tasks`)
    .send({ title: 'Свет: проверить лампы', status: 'done' });
  await a.post(`/api/v1/projects/${clip.id}/tasks`).send({ title: 'Найти локацию' });
  await a.post(`/api/v1/projects/${archived.id}/tasks`).send({ title: 'Свет из архива' });
  await a.post(`/api/v1/projects/${archived.id}/archive`);

  await a
    .post(`${base()}/notes`)
    .send({ title: 'Референсы', content: 'Тёплый свет на закате, длинные тени' });
  await a.post(`${base()}/notes`).send({ title: 'snake_case и 100%', content: 'про код' });

  // У Бориса — тоже «свет», но в его пространстве
  await as(boris.token)
    .post(`/api/v1/workspaces/${boris.wsId}/projects`)
    .send({ title: 'Свет Бориса', type: 'art' });
});

describe('Поиск', () => {
  it('ищет по проектам (название, описание), задачам и заметкам без учёта регистра', async () => {
    const res = await search('СВЕТ');

    expect(res.status).toBe(200);
    // Сначала названия, начинающиеся с запроса, потом содержащие, потом совпадение в описании
    expect(titles(res.body.projects)).toEqual([
      'Свет в окне',
      'Скидка 50% на свет',
      'Клип для группы',
    ]);
    expect(res.body.projects[2].snippet).toBe('Снимаем на крыше, нужен свет и дым-машина');
    expect(res.body.projects[0].snippet).toBeNull();

    // Начинается с «свет» — выше; невыполненная выше выполненной при равном ранге
    expect(titles(res.body.tasks)).toEqual(['Свет: проверить лампы', 'Арендовать свет']);
    expect(res.body.tasks[1].project).toMatchObject({ title: 'Клип для группы', type: 'video' });

    expect(res.body.notes).toEqual([
      expect.objectContaining({
        title: 'Референсы',
        snippet: 'Тёплый свет на закате, длинные тени',
      }),
    ]);
  });

  it('архивные проекты и их задачи не находятся', async () => {
    const res = await search('архив');
    expect(res.body.tasks).toEqual([]);
    expect(titles((await search('Старый')).body.projects)).toEqual([]);
  });

  it('не больше 5 результатов на тип', async () => {
    for (let i = 0; i < 7; i += 1) {
      await as(anna.token)
        .post(`${base()}/notes`)
        .send({ title: `Свет ${i}` });
    }
    expect((await search('свет')).body.notes).toHaveLength(5);
  });

  it('% и _ — обычные символы, а не шаблоны LIKE', async () => {
    expect(titles((await search('50%')).body.projects)).toEqual(['Скидка 50% на свет']);
    expect(titles((await search('0%')).body.notes)).toEqual(['snake_case и 100%']);
    expect(titles((await search('e_c')).body.notes)).toEqual(['snake_case и 100%']);
    // Без экранирования «_» значил бы «любой символ» (нашёлся бы «Клип»), «%» — «что угодно»
    // (нашёлся бы «Свет»). Экранированные — ничего не находят
    const wildcardUnderscore = await search('Кл_п');
    const wildcardPercent = await search('С%т');
    expect([...wildcardUnderscore.body.projects, ...wildcardUnderscore.body.tasks]).toEqual([]);
    expect([...wildcardPercent.body.projects, ...wildcardPercent.body.tasks]).toEqual([]);
  });

  it('запрос короче 2 символов (после обрезки пробелов) → 400', async () => {
    expect((await search('с')).status).toBe(400);
    expect((await search('  с  ')).status).toBe(400);
    expect((await as(anna.token).get(`${base()}/search`)).status).toBe(400);
  });

  it('ничего не найдено — пустые группы', async () => {
    expect((await search('квантовый')).body).toEqual({
      q: 'квантовый',
      projects: [],
      tasks: [],
      notes: [],
    });
  });
});

describe('Поиск: безопасность', () => {
  it('чужие данные не находятся: в своём пространстве — только своё', async () => {
    const res = await search('свет', boris.token, boris.wsId);
    expect(titles(res.body.projects)).toEqual(['Свет Бориса']);
    expect(res.body.tasks).toEqual([]);
    expect(res.body.notes).toEqual([]);
  });

  it('поиск в чужом пространстве → 404', async () => {
    expect((await search('свет', boris.token, anna.wsId)).status).toBe(404);
  });
});

describe('snippetAround', () => {
  it('кусочек вокруг совпадения с многоточиями; без совпадения — null', () => {
    const text = `${'а'.repeat(100)} нужен свет ${'б'.repeat(100)}`;
    const s = snippetAround(text, 'СВЕТ');
    expect(s.startsWith('…')).toBe(true);
    expect(s.endsWith('…')).toBe(true);
    expect(s).toContain('нужен свет');
    expect(snippetAround('короткий\n\nтекст', 'текст')).toBe('короткий текст');
    expect(snippetAround('без совпадений', 'свет')).toBeNull();
    expect(snippetAround(null, 'свет')).toBeNull();
  });
});
