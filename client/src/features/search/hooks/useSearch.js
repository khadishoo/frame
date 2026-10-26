import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { search } from '@/api/search';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';

export const SEARCH_DEBOUNCE = 250;
export const MIN_QUERY = 2;

/** Значение, которое «догоняет» value через delay мс после последнего изменения. */
export const useDebouncedValue = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

/**
 * Поиск с debounce: запрос уходит через 250 мс после последней буквы и только от 2 символов.
 * signal от TanStack Query отменяет устаревший запрос, если пользователь печатает дальше.
 */
export const useSearch = (input) => {
  const { workspaceId } = useCurrentWorkspace();
  const q = useDebouncedValue(input.trim(), SEARCH_DEBOUNCE);
  const enabled = Boolean(workspaceId) && q.length >= MIN_QUERY;

  const query = useQuery({
    queryKey: ['search', workspaceId, q],
    queryFn: ({ signal }) => search(workspaceId, q, signal),
    enabled,
    // Пока ищется новое — показываем прошлые результаты, а не мигаем пустотой
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

  return {
    ...query,
    q,
    // Ещё печатают (debounce не прошёл) — для индикатора «Ищем…»
    typing: input.trim() !== q,
    enabled,
  };
};
