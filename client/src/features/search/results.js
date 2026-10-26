/** Чистые функции поиска — без React, отдельно от компонентов (и для тестов, и для Fast Refresh). */

export const SEARCH_GROUPS = [
  { key: 'projects', label: 'Проекты' },
  { key: 'tasks', label: 'Задачи' },
  { key: 'notes', label: 'Заметки' },
];

// Куда ведёт результат: задача открывается окном на доске своего проекта
const hrefFor = {
  projects: (p) => `/app/projects/${p.id}`,
  tasks: (t) => `/app/projects/${t.project.id}?tab=board&task=${t.id}`,
  notes: (n) => `/app/ideas/${n.id}`,
};

/**
 * Результаты → плоский список для стрелок: { id, group, item, href, index }.
 * index — номер в общем порядке (группы идут друг за другом) — считается заранее,
 * чтобы при рендере групп не вести счётчик.
 */
export const flattenResults = (data) =>
  data
    ? SEARCH_GROUPS.flatMap(({ key }) =>
        data[key].map((item) => ({
          id: `${key}-${item.id}`,
          group: key,
          item,
          href: hrefFor[key](item),
        })),
      ).map((option, index) => ({ ...option, index }))
    : [];

/**
 * Разбить текст на куски по совпадениям с запросом (без учёта регистра):
 * splitMatches('Свет в окне', 'свет') → [{ text: 'Свет', match: true }, { text: ' в окне', match: false }]
 * Ищем обычной строкой, не RegExp: в запросе могут быть «.», «(», «*».
 */
export const splitMatches = (text = '', query = '') => {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, match: false }];

  const lower = text.toLowerCase();
  const parts = [];
  let from = 0;
  for (let index = lower.indexOf(q); index !== -1; index = lower.indexOf(q, from)) {
    if (index > from) parts.push({ text: text.slice(from, index), match: false });
    parts.push({ text: text.slice(index, index + q.length), match: true });
    from = index + q.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
};

/** Ctrl+K (Cmd+K на Mac) — по физической клавише, как и N: работает в любой раскладке. */
export const isSearchHotkey = (event) =>
  Boolean(
    event.code === 'KeyK' && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey,
  );
