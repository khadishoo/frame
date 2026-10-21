import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as projectsApi from '@/api/projects';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';
import { labelKeys } from '@/features/labels/hooks/useLabels';

export const PAGE_SIZE = 12;

/**
 * Ключи кэша:
 *  ['projects', wsId]           — все списки пространства (для инвалидации)
 *  ['projects', wsId, filters]  — конкретный список
 *  ['project', id]              — один проект
 */
export const projectKeys = {
  lists: (wsId) => ['projects', wsId],
  list: (wsId, filters) => ['projects', wsId, filters],
  detail: (id) => ['project', id],
};

/** Список проектов с «Показать ещё»: страницы по PAGE_SIZE, total от сервера. */
export const useProjects = (filters) => {
  const { workspaceId } = useCurrentWorkspace();

  return useInfiniteQuery({
    queryKey: projectKeys.list(workspaceId, filters),
    queryFn: ({ pageParam }) =>
      projectsApi.listProjects(workspaceId, { ...filters, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.offset + last.items.length < last.total ? last.offset + last.limit : undefined,
    enabled: Boolean(workspaceId),
    // Пока грузятся новые фильтры — показываем старый список, а не пустоту
    placeholderData: keepPreviousData,
  });
};

export const useProject = (id) =>
  useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.getProject(id),
    // 404 — ответ «проекта нет», повторять бессмысленно
    retry: (count, error) => error?.response?.status !== 404 && count < 1,
  });

/** Общая часть мутаций: обновить проект в кэше и пометить списки и счётчики устаревшими. */
const useProjectMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  const refreshLists = () => {
    queryClient.invalidateQueries({ queryKey: projectKeys.lists(workspaceId) });
    // У категорий и тегов есть счётчик проектов
    queryClient.invalidateQueries({ queryKey: labelKeys.list('categories', workspaceId) });
    queryClient.invalidateQueries({ queryKey: labelKeys.list('tags', workspaceId) });
  };

  return useMutation({
    mutationFn,
    ...options,
    onSuccess: (project, variables, context) => {
      if (project?.id) queryClient.setQueryData(projectKeys.detail(project.id), project);
      options.onSuccess?.(project, variables, context);
    },
    onSettled: (...args) => {
      refreshLists();
      options.onSettled?.(...args);
    },
  });
};

export const useCreateProject = () => {
  const { workspaceId } = useCurrentWorkspace();
  return useProjectMutation((data) => projectsApi.createProject(workspaceId, data));
};

/**
 * Изменение проекта: { id, data, tagIds? } — поля через PATCH, теги (если переданы) через PUT.
 * Оптимистично: проект в кэше меняется сразу, при ошибке — откат.
 */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useProjectMutation(
    async ({ id, data, tagIds }) => {
      let project =
        data && Object.keys(data).length > 0 ? await projectsApi.updateProject(id, data) : null;
      if (tagIds) project = await projectsApi.setProjectTags(id, tagIds);
      return project ?? projectsApi.getProject(id);
    },
    {
      onMutate: async ({ id, data }) => {
        const key = projectKeys.detail(id);
        await queryClient.cancelQueries({ queryKey: key });
        const previous = queryClient.getQueryData(key);
        // Оптимистично меняем только простые поля (статус, название…), не связи
        if (previous && data) {
          const simple = { ...data };
          delete simple.categoryId;
          queryClient.setQueryData(key, { ...previous, ...simple });
        }
        return { previous, key };
      },
      onError: (_error, _variables, context) => {
        if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      },
    },
  );
};

export const useArchiveProject = () => useProjectMutation((id) => projectsApi.archiveProject(id));

export const useRestoreProject = () => useProjectMutation((id) => projectsApi.restoreProject(id));

// Запись проекта в кэше не удаляем: страница проекта сразу уходит к списку,
// а иначе успела бы перезапросить проект и мигнуть «Проект не найден»
export const useDeleteProject = () => useProjectMutation((id) => projectsApi.deleteProject(id));
