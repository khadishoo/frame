import { useState } from 'react';
import { cn } from '@/lib/cn';
import { parseDate, plural } from '@/lib/dates';

const TASKS = ['задача', 'задачи', 'задач'];
const weekday = (date) =>
  new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(parseDate(date)).replace('.', '');
const longDate = (date) =>
  new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    parseDate(date),
  );

/**
 * Мини-график «выполнено задач за 7 дней». Один ряд — легенда не нужна (её роль у заголовка).
 * Столбики ≤ 24 px со скруглением 4 px только сверху, растут от одной базовой линии; сегодня —
 * акцентом, прошлые дни приглушены. Подсказка — по наведению и фокусу (зона — весь столбец);
 * для экранного диктора у каждого дня своя подпись.
 */
export function ActivityChart({ days, today }) {
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...days.map((d) => d.completed));

  return (
    // Растягивается на всю высоту виджета (соседний «Скоро дедлайн» обычно выше), но не ниже 8 rem
    <ul
      aria-label="Выполнено задач по дням"
      className="grid min-h-32 flex-1 grid-cols-7 gap-1 pt-6"
    >
      {days.map((day, index) => {
        const isToday = day.date === today;
        const label = `${isToday ? 'Сегодня' : longDate(day.date)}: ${day.completed} ${plural(day.completed, TASKS)}`;
        return (
          <li
            key={day.date}
            tabIndex={0}
            aria-label={label}
            onPointerEnter={() => setActive(index)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            className="focus-ring group relative flex flex-col items-center rounded-md outline-none"
          >
            {active === index && (
              <span
                role="presentation"
                className="pointer-events-none absolute -top-6 z-10 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-fg shadow-pop"
              >
                {day.completed} {plural(day.completed, TASKS)}
              </span>
            )}
            {/* Столбик и базовая линия */}
            <span className="flex w-full flex-1 items-end justify-center border-b border-border">
              <span
                className={cn(
                  'w-full max-w-6 rounded-t-[4px] transition-[height,background-color] duration-300',
                  isToday ? 'bg-accent' : 'bg-muted/30 group-hover:bg-muted/50',
                )}
                style={{ height: `${(day.completed / max) * 100}%` }}
              />
            </span>
            <span
              className={cn('mt-1.5 text-xs', isToday ? 'font-medium text-fg' : 'text-muted')}
              aria-hidden="true"
            >
              {isToday ? 'сег' : weekday(day.date)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
