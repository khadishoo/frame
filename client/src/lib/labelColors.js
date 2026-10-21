/**
 * Палитра категорий и тегов (как LABEL_COLORS на сервере).
 * Отдельная от токенов интерфейса: это «цвета пользователя», поэтому — палитра Tailwind
 * с парами оттенков для светлой и тёмной темы. Классы целиком — чтобы Tailwind их нашёл.
 */
export const LABEL_COLORS = {
  gray: {
    label: 'Серый',
    dot: 'bg-zinc-400',
    chip: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  },
  red: {
    label: 'Красный',
    dot: 'bg-red-500',
    chip: 'bg-red-500/10 text-red-700 dark:text-red-300',
  },
  orange: {
    label: 'Оранжевый',
    dot: 'bg-orange-500',
    chip: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  },
  amber: {
    label: 'Янтарный',
    dot: 'bg-amber-500',
    chip: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  },
  green: {
    label: 'Зелёный',
    dot: 'bg-green-500',
    chip: 'bg-green-500/10 text-green-700 dark:text-green-300',
  },
  teal: {
    label: 'Бирюзовый',
    dot: 'bg-teal-500',
    chip: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  },
  blue: {
    label: 'Синий',
    dot: 'bg-blue-500',
    chip: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  violet: {
    label: 'Фиолетовый',
    dot: 'bg-violet-500',
    chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  pink: {
    label: 'Розовый',
    dot: 'bg-pink-500',
    chip: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
  },
};

export const LABEL_COLOR_KEYS = Object.keys(LABEL_COLORS);

export const labelColor = (color) => LABEL_COLORS[color] ?? LABEL_COLORS.gray;
