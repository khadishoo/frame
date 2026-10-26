import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { projectTitleFrom } from '../src/modules/notes/notes.service.js';
import { as, setupUser } from './helpers.js';

let anna;
let project;
const api = () => as(anna.token);
const notesUrl = () => `/api/v1/workspaces/${anna.wsId}/notes`;
const create = (data) => api().post(notesUrl()).send(data);
const titles = (res) => res.body.items.map((n) => n.title);

beforeEach(async () => {
  anna = await setupUser();
  project = (
    await api()
      .post(`/api/v1/workspaces/${anna.wsId}/projects`)
      .send({ title: 'Клип', type: 'video' })
  ).body;
});

describe('CRUD заметок', () => {
  it('создание: минимум — заголовок или текст; остальное по умолчанию', async () => {
    const res = await create({ title: '  Идея для клипа  ' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      workspaceId: anna.wsId,
      authorId: anna.user.id,
      title: 'Идея для клипа',
      content: '',
      isPinned: false,
      color: null,
      project: null,
      isFavorite: false,
    });

    // Только текст — тоже идея
    expect((await create({ content: 'снять в тумане' })).status).toBe(201);
  });

  it('пустая идея и кривые поля → 400 у полей', async () => {
    const empty = await create({ title: '  ', content: '   ' });
    expect(empty.status).toBe(400);
    expect(empty.body.error.details[0].path).toBe('body.title');

    const bad = await create({ title: 'x', color: '#fff', isPinned: 'да', projectId: 'abc' });
    expect(bad.body.error.details.map((d) => d.path)).toEqual(
      expect.arrayContaining(['body.color', 'body.isPinned', 'body.projectId']),
    );
  });

  it('Markdown сохраняется как есть — с отступами и пустыми строками', async () => {
    const content = '# Заголовок\n\n- пункт\n  - вложенный\n\n```js\nconsole.log(1)\n```\n';
    expect((await create({ title: 'md', content })).body.content).toBe(content);
  });

  it('чтение, правка, закрепление, цвет, привязка к проекту и отвязка, удаление', async () => {
    const note = (await create({ title: 'Черновик' })).body;
    const url = `/api/v1/notes/${note.id}`;

    expect((await api().get(url)).body.title).toBe('Черновик');

    const patched = await api()
      .patch(url)
      .send({ isPinned: true, color: 'violet', projectId: project.id, content: 'текст' });
    expect(patched.body).toMatchObject({
      isPinned: true,
      color: 'violet',
      content: 'текст',
      project: { id: project.id, title: 'Клип', type: 'video', archivedAt: null },
    });

    const unlinked = await api().patch(url).send({ projectId: null, color: '' });
    expect(unlinked.body).toMatchObject({ project: null, color: null });

    expect((await api().patch(url).send({})).status).toBe(400);
    expect((await api().delete(url)).status).toBe(204);
    expect((await api().get(url)).status).toBe(404);
  });

  it('удаление проекта не удаляет заметку — она просто отвязывается', async () => {
    const note = (await create({ title: 'Сцены', projectId: project.id })).body;
    await api().delete(`/api/v1/projects/${project.id}`);
    expect((await api().get(`/api/v1/notes/${note.id}`)).body.project).toBeNull();
  });
});

describe('Список заметок', () => {
  beforeEach(async () => {
    await create({ title: 'Старая', content: 'про море' });
    await create({ title: 'Закреплённая', isPinned: true });
    await create({ title: 'Про клип', content: 'сцена в ТУМАНЕ', projectId: project.id });
    await create({ title: 'Свежая', content: '100% важно' });
  });

  it('закреплённые сверху, затем недавно изменённые', async () => {
    expect(titles(await api().get(notesUrl()))).toEqual([
      'Закреплённая',
      'Свежая',
      'Про клип',
      'Старая',
    ]);
  });

  it('правка поднимает заметку наверх (среди незакреплённых)', async () => {
    const old = (await api().get(notesUrl())).body.items.find((n) => n.title === 'Старая');
    await api().patch(`/api/v1/notes/${old.id}`).send({ content: 'про море и горы' });
    expect(titles(await api().get(notesUrl()))[1]).toBe('Старая');
  });

  it('q ищет в заголовке и тексте без учёта регистра; % — обычный символ', async () => {
    expect(titles(await api().get(`${notesUrl()}?q=туман`))).toEqual(['Про клип']);
    expect(titles(await api().get(`${notesUrl()}?q=МОРЕ`))).toEqual(['Старая']);
    expect(titles(await api().get(`${notesUrl()}?q=${encodeURIComponent('%')}`))).toEqual([
      'Свежая',
    ]);
  });

  it('projectId (или none) и pinned', async () => {
    expect(titles(await api().get(`${notesUrl()}?projectId=${project.id}`))).toEqual(['Про клип']);
    expect(titles(await api().get(`${notesUrl()}?projectId=none`))).toHaveLength(3);
    expect(titles(await api().get(`${notesUrl()}?pinned=true`))).toEqual(['Закреплённая']);
    expect(titles(await api().get(`${notesUrl()}?pinned=false`))).toHaveLength(3);
    expect((await api().get(`${notesUrl()}?pinned=yes`)).status).toBe(400);
  });

  it('пагинация: total, limit, offset', async () => {
    const page = await api().get(`${notesUrl()}?limit=2&offset=1`);
    expect(page.body).toMatchObject({ total: 4, limit: 2, offset: 1 });
    expect(titles(page)).toEqual(['Свежая', 'Про клип']);
  });
});

describe('Превратить идею в проект', () => {
  it('создаёт проект (название, описание из текста) и привязывает к нему заметку', async () => {
    const note = (
      await create({ title: 'Подкаст о звуке', content: 'Шесть выпусков\n\nпро синтезаторы' })
    ).body;

    const res = await api().post(`/api/v1/notes/${note.id}/convert`).send({ type: 'music' });

    expect(res.status).toBe(201);
    expect(res.body.project).toMatchObject({
      title: 'Подкаст о звуке',
      description: 'Шесть выпусков\n\nпро синтезаторы',
      type: 'music',
      status: 'active',
      createdBy: anna.user.id,
      workspaceId: anna.wsId,
      isFavorite: false,
    });
    expect(res.body.note.project).toMatchObject({ id: res.body.project.id });
    // Проект действительно появился в списке
    const list = await api().get(`/api/v1/workspaces/${anna.wsId}/projects`);
    expect(list.body.items.map((p) => p.title)).toContain('Подкаст о звуке');
  });

  it('без тела — тип «Другое»; без заголовка — первая строка текста без разметки', async () => {
    const note = (await create({ content: '\n## Комикс про кота\nдлинное описание' })).body;
    const res = await api().post(`/api/v1/notes/${note.id}/convert`);
    expect(res.body.project).toMatchObject({ title: 'Комикс про кота', type: 'other' });
  });

  it('projectTitleFrom: заголовок → первая строка → «Проект из идеи», не длиннее 120', () => {
    expect(projectTitleFrom({ title: ' Х ', content: 'y' })).toBe('Х');
    expect(projectTitleFrom({ title: '', content: '- [ ] пункт' })).toBe('[ ] пункт');
    expect(projectTitleFrom({ title: '', content: '  \n ' })).toBe('Проект из идеи');
    expect(projectTitleFrom({ title: 'а'.repeat(200), content: '' })).toHaveLength(120);
  });

  it('неизвестный тип → 400: нет ни проекта, ни привязки', async () => {
    const note = (await create({ title: 'Идея' })).body;
    const before = await db('projects').count({ n: '*' }).first();

    const res = await api().post(`/api/v1/notes/${note.id}/convert`).send({ type: 'cooking' });

    expect(res.status).toBe(400);
    expect(await db('projects').count({ n: '*' }).first()).toEqual(before);
    expect((await api().get(`/api/v1/notes/${note.id}`)).body.project).toBeNull();
  });
});
