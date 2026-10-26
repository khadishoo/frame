import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/config/db.js';
import { MIN_POSITION_GAP, POSITION_STEP } from '../src/modules/tasks/tasks.service.js';
import { as, setupUser } from './helpers.js';

let anna;
let project;
const api = () => as(anna.token);
const ids = {};

const move = (title, status, position) =>
  api().patch(`/api/v1/tasks/${ids[title]}/move`).send({ status, position });

/** Доска как { todo: ['A', 'B'], in_progress: [...], ... } — порядок из API. */
const board = async () => {
  const { items } = (await api().get(`/api/v1/projects/${project.id}/tasks`)).body;
  const columns = { todo: [], in_progress: [], review: [], done: [] };
  for (const task of items) columns[task.status].push(task.title);
  return columns;
};

beforeEach(async () => {
  anna = await setupUser();
  project = (
    await api()
      .post(`/api/v1/workspaces/${anna.wsId}/projects`)
      .send({ title: 'Клип', type: 'video' })
  ).body;
  for (const title of ['A', 'B', 'C', 'D']) {
    const task = (await api().post(`/api/v1/projects/${project.id}/tasks`).send({ title })).body;
    ids[title] = task.id;
  }
});

describe('Перемещение карточек', () => {
  it('позиция = среднее соседей; с краю — сосед ± шаг', async () => {
    // A=1000 B=2000 C=3000 D=4000
    expect((await move('D', 'todo', 1)).body.position).toBe(1500); // между A и B
    expect((await move('C', 'todo', 0)).body.position).toBe(0); // перед A (1000 − 1000)
    expect((await move('A', 'todo', 99)).body.position).toBe(3000); // за последним (B=2000)
    expect(await board()).toMatchObject({ todo: ['C', 'D', 'B', 'A'] });
  });

  it('порядок после серии перемещений между колонками совпадает с ожидаемым', async () => {
    await move('A', 'in_progress', 0); // todo: B C D | in_progress: A
    await move('C', 'in_progress', 0); // in_progress: C A
    await move('D', 'in_progress', 1); // in_progress: C D A
    await move('B', 'done', 0); // done: B
    await move('A', 'todo', 0); // todo: A | in_progress: C D
    await move('D', 'done', 0); // done: D B
    await move('C', 'in_progress', 0); // в своей же колонке на то же место
    await move('B', 'done', 0); // done: B D

    expect(await board()).toEqual({
      todo: ['A'],
      in_progress: ['C'],
      review: [],
      done: ['B', 'D'],
    });
  });

  it('статус меняется, задача в пустой колонке получает первый шаг', async () => {
    const res = await move('B', 'review', 5);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'review', position: POSITION_STEP });
  });

  it('промежуток стал слишком мал — колонка перенумеровывается, порядок не теряется', async () => {
    // Раз за разом ставим «нижнюю» карточку на место 1: промежуток между первой и второй
    // каждый раз делится пополам (1000 → 500 → 250 …), пока не станет меньше MIN_POSITION_GAP
    // После перенумерации (1000, 2000, 3000) место 1 снова даёт ровно 1500 — как в самый первый раз
    const expected = ['A', 'B', 'C', 'D'];
    let middles = 0;
    for (let i = 0; i < 30; i += 1) {
      const last = expected.pop();
      expected.splice(1, 0, last);
      const res = await move(last, 'todo', 1);
      expect(res.status).toBe(200);
      if (res.body.position === 1.5 * POSITION_STEP) middles += 1;
      expect((await board()).todo).toEqual(expected);
    }
    expect(middles).toBe(2);

    // Все соседние позиции снова разнесены не меньше чем на MIN_POSITION_GAP
    const positions = (
      await db('tasks').where({ project_id: project.id }).orderBy('position').select('position')
    ).map((row) => row.position);
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i] - positions[i - 1]).toBeGreaterThanOrEqual(MIN_POSITION_GAP);
    }
  });

  it('валидация: статус и место в колонке', async () => {
    const res = await move('A', 'later', -1);
    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['body.status', 'body.position']));
    expect((await move('A', 'todo', 1.5)).status).toBe(400);
  });

  it('одновременные перемещения не ломают порядок (блокировка проекта)', async () => {
    await Promise.all([
      move('A', 'done', 0),
      move('B', 'done', 0),
      move('C', 'done', 0),
      move('D', 'done', 0),
    ]);
    const { done } = await board();
    expect(done.toSorted()).toEqual(['A', 'B', 'C', 'D']);
    // Позиции уникальны — порядок однозначен
    const positions = await db('tasks').where({ status: 'done' }).pluck('position');
    expect(new Set(positions).size).toBe(4);
  });
});
