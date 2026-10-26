import { describe, expect, it } from 'vitest';
import { groupMyTasks, myTaskGroup } from '../myTasks';

// «Сегодня» в тестах фиксировано: понедельник, 26 октября 2026, полдень
const today = new Date(2026, 9, 26, 12);
const task = (id, dueDate, extra = {}) => ({
  id,
  dueDate,
  status: 'todo',
  completedAt: null,
  ...extra,
});

describe('Группы «Моих задач»', () => {
  it('по сроку: просрочено, сегодня, неделя (до 7 дней), позже, без срока', () => {
    expect(myTaskGroup(task('a', '2026-10-25'), today)).toBe('overdue');
    expect(myTaskGroup(task('b', '2026-10-26'), today)).toBe('today');
    expect(myTaskGroup(task('c', '2026-10-27'), today)).toBe('week');
    expect(myTaskGroup(task('d', '2026-11-02'), today)).toBe('week'); // ровно через 7 дней
    expect(myTaskGroup(task('e', '2026-11-03'), today)).toBe('later');
    expect(myTaskGroup(task('f', null), today)).toBe('none');
  });

  it('выполненные — «недавно» неделю после выполнения, потом скрываются; просрочкой не считаются', () => {
    const recent = task('g', '2026-10-01', {
      status: 'done',
      completedAt: new Date(2026, 9, 24).toISOString(),
    });
    const old = task('h', null, {
      status: 'done',
      completedAt: new Date(2026, 8, 1).toISOString(),
    });
    expect(myTaskGroup(recent, today)).toBe('done');
    expect(myTaskGroup(old, today)).toBeNull();
  });

  it('groupMyTasks: порядок групп фиксирован, пустые пропускаются, порядок задач — с сервера', () => {
    const tasks = [
      task('later', '2026-12-01'),
      task('overdue-1', '2026-10-20'),
      task('overdue-2', '2026-10-25'),
      task('nodate', null),
      task('done', null, { status: 'done', completedAt: new Date(2026, 9, 26, 9).toISOString() }),
    ];
    const groups = groupMyTasks(tasks, today);

    expect(groups.map((g) => g.key)).toEqual(['overdue', 'later', 'none', 'done']);
    expect(groups[0]).toMatchObject({ label: 'Просрочено' });
    expect(groups[0].tasks.map((t) => t.id)).toEqual(['overdue-1', 'overdue-2']);
  });
});
