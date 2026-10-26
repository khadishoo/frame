import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as favoritesApi from '@/api/favorites';
import { useAuthStore } from '@/features/auth/authStore';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { toast } from '@/lib/toast';

export const favoriteKeys = { all: ['favorites'] };

export const useFavorites = () => {
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: favoritesApi.listFavorites,
    enabled: authenticated,
  });
};

// Где в кэше живут проекты и заметки (префиксы ключей): списки, карточки, избранное
const CACHED = {
  project: [['projects'], ['project']],
  note: [['notes'], ['note']],
};
const LIST_FIELD = { project: 'projects', note: 'notes' };

/**
 * Поставить isFavorite записи id в данных кэша любой формы: сама запись, { items },
 * «бесконечный» список { pages: [{ items }] }.
 */
export const patchFavoriteFlag = (data, id, isFavorite) => {
  if (!data) return data;
  if (data.id === id) return { ...data, isFavorite };
  if (Array.isArray(data.items)) {
    return {
      ...data,
      items: data.items.map((item) => (item.id === id ? { ...item, isFavorite } : item)),
    };
  }
  if (Array.isArray(data.pages)) {
    return { ...data, pages: data.pages.map((page) => patchFavoriteFlag(page, id, isFavorite)) };
  }
  return data;
};

/**
 * Звёздочка: toggle({ type, item, value }). Оптимистично — во всех списках и карточках
 * сразу, в «Избранном» запись появляется/исчезает сразу; ошибка — откат и тост.
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['favorites', 'toggle'],
    mutationFn: ({ type, item, value }) =>
      value ? favoritesApi.addFavorite(type, item.id) : favoritesApi.removeFavorite(type, item.id),
    onMutate: async ({ type, item, value }) => {
      const prefixes = [...CACHED[type], favoriteKeys.all];
      await Promise.all(prefixes.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const snapshot = prefixes.flatMap((queryKey) => queryClient.getQueriesData({ queryKey }));

      for (const queryKey of CACHED[type]) {
        queryClient.setQueriesData({ queryKey }, (data) => patchFavoriteFlag(data, item.id, value));
      }
      queryClient.setQueryData(favoriteKeys.all, (data) => {
        if (!data) return data;
        const field = LIST_FIELD[type];
        const rest = data[field].filter((entry) => entry.id !== item.id);
        // Последние отмеченные — первыми, как на сервере
        return { ...data, [field]: value ? [{ ...item, isFavorite: true }, ...rest] : rest };
      });
      return { snapshot };
    },
    onError: (error, { value }, context) => {
      for (const [key, data] of context?.snapshot ?? []) queryClient.setQueryData(key, data);
      toast.error(value ? 'Не удалось добавить в избранное' : 'Не удалось убрать из избранного', {
        description: getErrorMessage(error),
      });
    },
    onSettled: () => {
      // Пока щёлкают другие звёздочки — не перезапрашиваем (ответ ещё не учтёт их)
      if (queryClient.isMutating({ mutationKey: ['favorites'] }) > 1) return;
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
};
