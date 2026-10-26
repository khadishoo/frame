import { describe, expect, it } from 'vitest';
import {
  applyMove,
  groupByStatus,
  locate,
  moveAcross,
  patchTask,
  positionAt,
  reorderWithin,
  toIds,
} from '../board';

const task = (id, status, position, extra = {}) => ({
  id,
  status,
  position,
  completedAt: null,
  ...extra,
});

/** Доска как { todo: ['A', 'B'], … } — порядок, который увидит пользователь. */
const titles = (tasks) => toIds(groupByStatus(tasks));

describe('positionAt: позиция для места в колонке', () => {
  const column = [task('A', 'todo', 1000), task('B', 'todo', 2000), task('C', 'todo', 3000)];

  it('между соседями — среднее', () => {
    expect(positionAt(column, 1)).toBe(1500);
    expect(positionAt(column, 2)).toBe(2500);
  });

  it('наверх — первый минус шаг, вниз — последний плюс шаг', () => {
    expect(positionAt(column, 0)).toBe(0);
    expect(positionAt(column, 3)).toBe(4000);
  });

  it('в пустую колонку — первый шаг', () => {
    expect(positionAt([], 0)).toBe(1000);
  });
});

describe('applyMove: оптимистичное перемещение', () => {
  const board = () => [
    task('A', 'todo', 1000),
    task('B', 'todo', 2000),
    task('C', 'todo', 3000),
    task('D', 'in_progress', 1000),
  ];

  it('внутри колонки: «место после перемещения» без самой карточки', () => {
    // C на место 0 → C A B; A на место 2 (в конец) → B C A
    expect(titles(applyMove(board(), { id: 'C', status: 'todo', index: 0 })).todo).toEqual([
      'C',
      'A',
      'B',
    ]);
    expect(titles(applyMove(board(), { id: 'A', status: 'todo', index: 2 })).todo).toEqual([
      'B',
      'C',
      'A',
    ]);
  });

  it('серия перемещений между колонками даёт ожидаемый порядок', () => {
    let tasks = board();
    tasks = applyMove(tasks, { id: 'A', status: 'in_progress', index: 0 }); // ip: A D
    tasks = applyMove(tasks, { id: 'C', status: 'in_progress', index: 1 }); // ip: A C D
    tasks = applyMove(tasks, { id: 'B', status: 'done', index: 0 }); // done: B
    tasks = applyMove(tasks, { id: 'D', status: 'done', index: 0 }); // done: D B
    tasks = applyMove(tasks, { id: 'A', status: 'in_progress', index: 9 }); // ip: C A

    expect(titles(tasks)).toEqual({
      todo: [],
      in_progress: ['C', 'A'],
      review: [],
      done: ['D', 'B'],
    });
  });

  it('десятки вставок в одно место не ломают порядок (промежуток делится пополам)', () => {
    let tasks = [task('A', 'todo', 1000), task('B', 'todo', 2000)];
    const expected = ['A', 'B'];
    for (let i = 0; i < 40; i += 1) {
      tasks = [...tasks, task(`N${i}`, 'review', 1000)];
      tasks = applyMove(tasks, { id: `N${i}`, status: 'todo', index: 1 });
      expected.splice(1, 0, `N${i}`);
    }
    expect(titles(tasks).todo).toEqual(expected);
  });

  it('completedAt: ставится при входе в done и очищается при выходе', () => {
    const moved = applyMove(board(), { id: 'A', status: 'done', index: 0 });
    const done = moved.find((t) => t.id === 'A');
    expect(done.completedAt).not.toBeNull();
    const back = applyMove(moved, { id: 'A', status: 'review', index: 0 });
    expect(back.find((t) => t.id === 'A').completedAt).toBeNull();
  });
});

describe('Перетаскивание: колонки из id', () => {
  const columns = { todo: ['A', 'B', 'C'], in_progress: ['D'], review: [], done: [] };

  it('над карточкой другой колонки — встаёт на её место', () => {
    expect(moveAcross(columns, 'B', 'D')).toMatchObject({
      todo: ['A', 'C'],
      in_progress: ['B', 'D'],
    });
  });

  it('над пустой колонкой — в конец', () => {
    expect(moveAcross(columns, 'A', 'review')).toMatchObject({ todo: ['B', 'C'], review: ['A'] });
  });

  it('в своей колонке moveAcross ничего не меняет, reorderWithin — переставляет', () => {
    expect(moveAcross(columns, 'A', 'C')).toBe(columns);
    expect(reorderWithin(columns, 'A', 'C').todo).toEqual(['B', 'C', 'A']);
    expect(reorderWithin(columns, 'C', 'A').todo).toEqual(['C', 'A', 'B']);
  });

  it('locate — колонка и место', () => {
    expect(locate(columns, 'C')).toEqual({ status: 'todo', index: 2 });
    expect(locate(columns, 'X')).toBeNull();
  });
});

describe('patchTask: оптимистичная правка полей', () => {
  const me = { id: 'u-1', name: 'Анна' };
  const siblings = [task('A', 'todo', 1000), task('B', 'done', 5000)];

  it('смена статуса — в конец новой колонки', () => {
    expect(patchTask(siblings[0], { status: 'done' }, { siblings, me })).toMatchObject({
      status: 'done',
      position: 6000,
    });
  });

  it('исполнитель: я — с именем, null — без исполнителя', () => {
    expect(patchTask(siblings[0], { assigneeId: 'u-1' }, { me }).assignee).toEqual(me);
    expect(patchTask({ ...siblings[0], assignee: me }, { assigneeId: null }).assignee).toBeNull();
  });
});
