import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { as, setupUser } from './helpers.js';

let anna;
let boris;
const api = () => as(anna.token);
const base = () => `/api/v1/workspaces/${anna.wsId}`;

// Дата «YYYY-MM-DD» в поясе tz (сегодня ± offset дней) — так же считает сервер
const localDate = (instant, tz) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(instant);
const day = (offset) => localDate(new Date(Date.now() + offset * 86_400_000), 'UTC');

const createProject = async (data) => (await api().post(`${base()}/projects`).send(data)).body;
const createTask = async (projectId, data) =>
  (await api().post(`/api/v1/projects/${projectId}/tasks`).send(data)).body;
const setTask = (id, columns) => db('tasks').where({ id }).update(columns);

const dashboard = (tz = 'UTC', token = anna.token) =>
  as(token).get(`/api/v1/workspaces/${anna.wsId}/dashboard?tz=${encodeURIComponent(tz)}`);

beforeEach(async () => {
  anna = await setupUser();
  boris = await setupUser({ email: 'boris@example.com', name: 'Борис' });
});

describe('Дашборд: цифры на подготовленных данных', () => {
  let ids;

  beforeEach(async () => {
    const active = await createProject({ title: 'Альбом', type: 'music', status: 'active' });
    await createProject({ title: 'Клип', type: 'video', status: 'paused' });
    await createProject({ title: 'Подкаст', type: 'other', status: 'idea' });
    const archived = await createProject({ title: 'Архив', type: 'dev', status: 'active' });

    const t = async (title, extra = {}) => (await createTask(active.id, { title, ...extra })).id;
    ids = {
      inProgress: await t('В работе', { status: 'in_progress' }),
      review: await t('На проверке', { status: 'review' }),
      overdue: await t('Просрочена', { dueDate: day(-1) }),
      doneRecently: await t('Сделана позавчера', { status: 'done', dueDate: day(-1) }),
      doneLongAgo: await t('Сделана давно', { status: 'done' }),
      today: await t('На сегодня', { dueDate: day(0) }),
      soon: await t('Через 3 дня', { dueDate: day(3), priority: 'high' }),
      later: await t('Через месяц', { status: 'in_progress', dueDate: day(30) }),
    };
    await setTask(ids.doneRecently, { completed_at: db.raw("now() - interval '2 days'") });
    await setTask(ids.doneLongAgo, { completed_at: db.raw("now() - interval '10 days'") });

    // Задачи архивного проекта не считаются нигде
    await createTask(archived.id, { title: 'A1', status: 'in_progress' });
    await createTask(archived.id, { title: 'A2', dueDate: day(-5) });
    await createTask(archived.id, { title: 'A3', status: 'done' });
    await createTask(archived.id, { title: 'A4', dueDate: day(1) });
    await api().post(`/api/v1/projects/${archived.id}/archive`);

    for (const title of ['Идея 1', 'Идея 2', 'Идея 3', 'Идея 4']) {
      await api()
        .post(`${base()}/notes`)
        .send({ title, isPinned: title === 'Идея 1' });
    }
  });

  it('статистика: активные проекты, в работе, выполнено за 7 дней, просрочено', async () => {
    const res = await dashboard();

    expect(res.status).toBe(200);
    expect(res.body.today).toBe(day(0));
    expect(res.body.stats).toEqual({
      activeProjects: 1, // paused, idea и архивный не считаются
      tasksInProgress: 3, // in_progress + review
      completedThisWeek: 1, // «давно» (10 дней) — за пределами недели
      overdue: 1, // выполненная с прошедшим дедлайном — не просрочена
    });
    expect(res.body.totals).toEqual({ projects: 3, tasks: 8, notes: 4 });
  });

  it('активность: 7 дней подряд до сегодня, пустые дни — нули, сумма = «выполнено за 7 дней»', async () => {
    const { activity, stats } = (await dashboard()).body;

    expect(activity.map((d) => d.date)).toEqual([-6, -5, -4, -3, -2, -1, 0].map(day));
    expect(activity.map((d) => d.completed)).toEqual([0, 0, 0, 0, 1, 0, 0]);
    expect(activity.reduce((s, d) => s + d.completed, 0)).toBe(stats.completedThisWeek);
  });

  it('ближайшие дедлайны: с сегодняшнего дня, невыполненные, по дате, с проектом', async () => {
    const { upcomingTasks } = (await dashboard()).body;
    expect(upcomingTasks.map((t) => t.title)).toEqual(['На сегодня', 'Через 3 дня', 'Через месяц']);
    expect(upcomingTasks[0].project).toMatchObject({ title: 'Альбом', type: 'music' });
  });

  it('недавние проекты (без архива, с прогрессом и isFavorite) и 3 последние идеи', async () => {
    const album = (await api().get(`${base()}/projects?q=Альбом`)).body.items[0];
    await api().post('/api/v1/favorites').send({ type: 'project', id: album.id });

    const { recentProjects, recentNotes } = (await dashboard()).body;

    expect(recentProjects.map((p) => p.title)).toEqual(
      expect.arrayContaining(['Альбом', 'Клип', 'Подкаст']),
    );
    expect(recentProjects).toHaveLength(3);
    const albumCard = recentProjects.find((p) => p.title === 'Альбом');
    expect(albumCard).toMatchObject({
      isFavorite: true,
      taskCounts: { total: 8, done: 2 },
      progress: 25,
    });
    // Свежие — по времени изменения, закрепление тут не важно
    expect(recentNotes.map((n) => n.title)).toEqual(['Идея 4', 'Идея 3', 'Идея 2']);
    expect(recentNotes[0]).toHaveProperty('isFavorite', false);
  });
});

describe('Дашборд: часовой пояс', () => {
  it('задача, выполненная в 23:00 по UTC, у пользователя в Токио — уже «следующий день»', async () => {
    const project = (await api().post(`${base()}/projects`).send({ title: 'П', type: 'art' })).body;
    const task = await createTask(project.id, { title: 'Ночная', status: 'done' });
    // Вчера, 23:00 по UTC
    const instant = new Date(`${day(-1)}T23:00:00Z`);
    await setTask(task.id, { completed_at: instant });

    const utc = (await dashboard('UTC')).body.activity;
    const tokyo = (await dashboard('Asia/Tokyo')).body.activity;
    const doneOn = (activity) => activity.find((d) => d.completed === 1)?.date;

    expect(doneOn(utc)).toBe(localDate(instant, 'UTC'));
    expect(doneOn(tokyo)).toBe(localDate(instant, 'Asia/Tokyo'));
    expect(doneOn(utc)).not.toBe(doneOn(tokyo));
  });

  it('неизвестный пояс → 400; без tz — UTC', async () => {
    expect((await dashboard('Mars/Olympus')).status).toBe(400);
    const res = await as(anna.token).get(`${base()}/dashboard`);
    expect(res.body.today).toBe(day(0));
  });
});

describe('Дашборд: новый пользователь и безопасность', () => {
  it('пустое пространство — нули и пустые списки (клиент покажет онбординг)', async () => {
    const res = await dashboard();
    expect(res.body).toMatchObject({
      stats: { activeProjects: 0, tasksInProgress: 0, completedThisWeek: 0, overdue: 0 },
      totals: { projects: 0, tasks: 0, notes: 0 },
      recentProjects: [],
      upcomingTasks: [],
      recentNotes: [],
    });
    expect(res.body.activity).toHaveLength(7);
  });

  it('чужое пространство → 404; чужие данные в мой дашборд не попадают', async () => {
    const own = await createProject({ title: 'Секрет Анны', type: 'art' });
    await createTask(own.id, { title: 'Задача Анны', dueDate: day(1) });
    await api().post(`${base()}/notes`).send({ title: 'Идея Анны' });

    expect((await dashboard('UTC', boris.token)).status).toBe(404);

    const borisDashboard = await as(boris.token).get(`/api/v1/workspaces/${boris.wsId}/dashboard`);
    expect(borisDashboard.body).toMatchObject({
      totals: { projects: 0, tasks: 0, notes: 0 },
      recentProjects: [],
      upcomingTasks: [],
      recentNotes: [],
    });
  });
});
