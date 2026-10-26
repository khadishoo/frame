import { LABEL_COLORS } from '@/lib/labelColors';

/**
 * Фон и рамка цветной карточки идеи — та же палитра, что у меток (цвета пользователя,
 * пары оттенков подходят обеим темам). null — обычная карточка. Классы целиком для Tailwind.
 */
export const NOTE_CARD_COLORS = {
  gray: 'border-zinc-500/25 bg-zinc-500/10',
  red: 'border-red-500/25 bg-red-500/10',
  orange: 'border-orange-500/25 bg-orange-500/10',
  amber: 'border-amber-500/30 bg-amber-500/10',
  green: 'border-green-500/25 bg-green-500/10',
  teal: 'border-teal-500/25 bg-teal-500/10',
  blue: 'border-blue-500/25 bg-blue-500/10',
  violet: 'border-violet-500/25 bg-violet-500/10',
  pink: 'border-pink-500/25 bg-pink-500/10',
};

export const noteColorOptions = [
  { value: null, label: 'Без цвета', dot: 'bg-surface ring-1 ring-inset ring-border' },
  ...Object.entries(LABEL_COLORS).map(([value, color]) => ({
    value,
    label: color.label,
    dot: color.dot,
  })),
];

/**
 * Markdown → обычный текст для превью в карточке (без разметки: #, >, -, **, `, [x]).
 * В карточке-ссылке нельзя рендерить Markdown: ссылки внутри ссылки — некорректный HTML.
 */
export const plainText = (markdown = '') =>
  markdown
    .replace(/```[^\n]*\n?/g, '')
    // [ \t], а не \s: \s совпал бы и с переводом строки и «съел» пустую строку между абзацами
    .replace(/^[ \t]{0,3}(#{1,6}|>|[-*+]|\d+\.)[ \t]+/gm, '')
    .replace(/\[( |x|X)\]\s/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|~~|`)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** Заголовок для показа: «Без названия», если пусто. */
export const noteTitle = (note) => note.title.trim() || 'Без названия';
