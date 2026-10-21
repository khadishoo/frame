/**
 * Даты проектов приходят строкой «YYYY-MM-DD» (без времени и часового пояса).
 * Разбираем их как ЛОКАЛЬНУЮ дату — иначе new Date('2026-10-25') в UTC мог бы дать 24-е.
 */
export const parseDate = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Разница в календарных днях: положительная — в будущем. */
export const daysUntil = (value, today = new Date()) => {
  const date = parseDate(value);
  if (!date) return null;
  return Math.round((startOfDay(date) - startOfDay(today)) / 86_400_000);
};

/** 1 день, 2 дня, 5 дней */
export const plural = (n, [one, few, many]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

const DAYS = ['день', 'дня', 'дней'];

/** «12 дек», а для другого года — «12 дек 2027» */
export const formatDate = (value, today = new Date()) => {
  const date = parseDate(value);
  if (!date) return '';
  return (
    new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      ...(date.getFullYear() !== today.getFullYear() && { year: 'numeric' }),
    })
      .format(date)
      // «дек.» → «дек», «2027 г.» → «2027»
      .replace(/\s*г\.$/, '')
      .replace('.', '')
  );
};

/**
 * Дедлайн для карточки: { label, tone, title }
 * tone: 'overdue' (красный) | 'soon' (≤ 3 дней) | 'normal' | 'done' (проект завершён).
 */
export const describeDue = (dueDate, { completed = false, today = new Date() } = {}) => {
  if (!dueDate) return null;
  const days = daysUntil(dueDate, today);
  const title = `Дедлайн: ${formatDate(dueDate, today)}`;

  if (completed) return { label: formatDate(dueDate, today), tone: 'done', title };
  if (days < 0) {
    const n = -days;
    return { label: `Просрочено на ${n} ${plural(n, DAYS)}`, tone: 'overdue', title };
  }
  if (days === 0) return { label: 'Сегодня', tone: 'soon', title };
  if (days === 1) return { label: 'Завтра', tone: 'soon', title };
  if (days <= 7)
    return {
      label: `через ${days} ${plural(days, DAYS)}`,
      tone: days <= 3 ? 'soon' : 'normal',
      title,
    };
  return { label: formatDate(dueDate, today), tone: 'normal', title };
};
