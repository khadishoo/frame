import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as labelsApi from '@/api/labels';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';

/** kind — 'categories' | 'tags'. Ключ: ['categories', wsId] / ['tags', wsId] */
export const labelKeys = {
  list: (kind, wsId) => [kind, wsId],
};

const useLabels = (kind) => {
  const { workspaceId } = useCurrentWorkspace();
  return useQuery({
    queryKey: labelKeys.list(kind, workspaceId),
    queryFn: () => labelsApi.listLabels(kind, workspaceId),
    enabled: Boolean(workspaceId),
  });
};

export const useCategories = () => useLabels('categories');
export const useTags = () => useLabels('tags');

/**
 * Мутации меток. Оптимистично обновляют список; переименование или удаление метки
 * меняет и проекты (у них в ответе название категории/тегов) — их списки освежаем.
 */
export const useLabelMutations = (kind) => {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  const key = labelKeys.list(kind, workspaceId);

  const optimistic = (apply) => ({
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      if (previous) queryClient.setQueryData(key, apply(previous, variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });

  const create = useMutation({
    mutationFn: (data) => labelsApi.createLabel(kind, workspaceId, data),
    onSuccess: (label) => {
      queryClient.setQueryData(key, (list = []) => [...list, label]);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => labelsApi.updateLabel(kind, id, data),
    ...optimistic((list, { id, data }) => list.map((l) => (l.id === id ? { ...l, ...data } : l))),
  });

  const remove = useMutation({
    mutationFn: (id) => labelsApi.deleteLabel(kind, id),
    ...optimistic((list, id) => list.filter((l) => l.id !== id)),
  });

  return { create, update, remove };
};
