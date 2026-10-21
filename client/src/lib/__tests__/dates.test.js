import { describe, expect, it } from 'vitest';
import { daysUntil, describeDue, parseDate, plural } from '../dates';

const today = new Date(2026, 9, 21); // 21 октября 2026, локальное время

describe('даты проектов', () => {
  it('«YYYY-MM-DD» разбирается как локальная дата, без сдвига дня', () => {
    const date = parseDate('2026-10-25');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 25]);
  });

  it('разница в календарных днях', () => {
    expect(daysUntil('2026-10-21', today)).toBe(0);
    expect(daysUntil('2026-10-24', today)).toBe(3);
    expect(daysUntil('2026-10-19', today)).toBe(-2);
  });

  it('склонение: 1 день, 2 дня, 5 дней, 11 дней, 21 день', () => {
    const days = ['день', 'дня', 'дней'];
    expect([1, 2, 5, 11, 21, 22, 112].map((n) => `${n} ${plural(n, days)}`)).toEqual([
      '1 день',
      '2 дня',
      '5 дней',
      '11 дней',
      '21 день',
      '22 дня',
      '112 дней',
    ]);
  });

  it.each([
    ['2026-10-19', 'Просрочено на 2 дня', 'overdue'],
    ['2026-10-20', 'Просрочено на 1 день', 'overdue'],
    ['2026-10-21', 'Сегодня', 'soon'],
    ['2026-10-22', 'Завтра', 'soon'],
    ['2026-10-24', 'через 3 дня', 'soon'],
    ['2026-10-27', 'через 6 дней', 'normal'],
    ['2026-12-05', '5 дек', 'normal'],
    ['2027-01-15', '15 янв 2027', 'normal'],
  ])('дедлайн %s → «%s» (%s)', (due, label, tone) => {
    expect(describeDue(due, { today })).toMatchObject({ label, tone });
  });

  it('у завершённого проекта просрочки нет', () => {
    expect(describeDue('2026-10-01', { today, completed: true })).toMatchObject({ tone: 'done' });
  });

  it('без дедлайна — null', () => {
    expect(describeDue(null, { today })).toBeNull();
  });
});
