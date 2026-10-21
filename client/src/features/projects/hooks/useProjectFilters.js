import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { PROJECT_STATUS_KEYS } from '@/lib/projectStatuses';
import { PROJECT_TYPE_KEYS } from '@/lib/projectTypes';

export const SORTS = {
  updated_at: 'Недавно изменённые',
  due_date: 'По дедлайну',
  title: 'По названию',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Допустимые значения параметров адреса; всё остальное игнорируем (ссылка не «сломается»)
const validators = {
  view: (v) => v === 'list',
  type: (v) => PROJECT_TYPE_KEYS.includes(v),
  status: (v) => PROJECT_STATUS_KEYS.includes(v) || v === 'archived',
  category: (v) => v === 'none' || UUID_RE.test(v),
  tag: (v) => UUID_RE.test(v),
  sort: (v) => v in SORTS && v !== 'updated_at',
  q: (v) => v.trim().length > 0,
};

// Параметры, которые фильтруют список (вид и сортировка — нет)
const FILTER_KEYS = ['type', 'status', 'category', 'tag', 'q'];

/**
 * Фильтры страницы «Проекты» живут в адресе: ?type=music&status=active&view=list…
 * Ссылкой можно поделиться, «Назад» откатывает изменения фильтров.
 */
export const useProjectFilters = () => {
  const [params, setParams] = useSearchParams();

  const state = useMemo(() => {
    const read = (key) => {
      const value = params.get(key);
      return value !== null && validators[key](value) ? value : undefined;
    };
    return {
      view: read('view') ?? 'grid',
      type: read('type'),
      status: read('status'),
      category: read('category'),
      tag: read('tag'),
      sort: read('sort') ?? 'updated_at',
      q: read('q') ?? '',
    };
  }, [params]);

  /**
   * Изменить параметры: undefined/'' — убрать из адреса.
   * replace — без новой записи в истории (для поиска по мере ввода).
   */
  const update = useCallback(
    (changes, { replace = false } = {}) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            const isDefault =
              value === undefined ||
              value === '' ||
              (key === 'view' && value === 'grid') ||
              (key === 'sort' && value === 'updated_at');
            if (isDefault) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  const reset = useCallback(
    () => update(Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined]))),
    [update],
  );

  // Что уходит на сервер (вид — только клиентский)
  const query = useMemo(
    () => ({
      type: state.type,
      status: state.status,
      category: state.category,
      tag: state.tag,
      q: state.q || undefined,
      sort: state.sort,
    }),
    [state],
  );

  const hasFilters =
    FILTER_KEYS.some((key) => key !== 'status' && Boolean(state[key])) ||
    (state.status !== undefined && state.status !== 'archived');

  return { ...state, query, update, reset, hasFilters, isArchive: state.status === 'archived' };
};
