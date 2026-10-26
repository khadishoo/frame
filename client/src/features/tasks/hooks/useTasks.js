import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from '@/api/tasks';
import { useAuthStore } from '@/features/auth/authStore';
import { projectKeys } from '@/features/projects/hooks/useProjects';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { toast } from '@/lib/toast';
import { applyMove, endOfColumn, patchTask } from '../board';

/**
 * Ключи кэша:
 *  ['tasks']                              — все списки задач (для инвалидации)
 *  ['tasks', 'project', projectId]        — доска / таблица проекта
 *  ['tasks', 'workspace', wsId, filters]  — «Мои задачи»
 *  ['task', id]                           — одна задача (окно задачи)
 */
export const taskKeys = {
  all: ['tasks'],
  project: (projectId) => ['tasks', 'project', projectId],
  workspace: (wsId, filters) => ['tasks', 'workspace', wsId, filters],
  detail: (id) => ['task', id],
};

const notFound = (error) => error?.response?.status === 404;

export const useProjectTasks = (projectId) =>
  useQuery({
    queryKey: taskKeys.project(projectId),
    queryFn: () => tasksApi.listProjectTasks(projectId),
    enabled: Boolean(projectId),
    select: (data) => data.items,
  });

export const useMyTasks = (filters = {}) => {
  const { workspaceId } = useCurrentWorkspace();
  return useQuery({
    queryKey: taskKeys.workspace(workspaceId, filters),
    queryFn: () => tasksApi.listWorkspaceTasks(workspaceId, { ...filters, limit: 500 }),
    enabled: Boolean(workspaceId),
    select: (data) => data.items,
  });
};

/** Задача по id. Пока она грузится — показываем копию из уже загруженных списков. */
export const useTask = (id) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getTask(id),
    enabled: Boolean(id),
    placeholderData: () => findInLists(queryClient, id),
    retry: (count, error) => !notFound(error) && count < 1,
  });
};

// ── Общее для мутаций ───────────────────────────────────────────────────────

const findInLists = (queryClient, id) => {
  for (const [, data] of queryClient.getQueriesData({ queryKey: taskKeys.all })) {
    const task = data?.items?.find((t) => t.id === id);
    if (task) return task;
  }
  return undefined;
};

/** Изменить items во всех закэшированных списках задач. */
const updateLists = (queryClient, fn) =>
  queryClient.setQueriesData({ queryKey: taskKeys.all }, (data) =>
    data?.items ? { ...data, items: fn(data.items) } : data,
  );

/** Снимок списков и задачи — чтобы откатить оптимистичное изменение. */
const snapshot = (queryClient, id) => ({
  id,
  lists: queryClient.getQueriesData({ queryKey: taskKeys.all }),
  detail: queryClient.getQueryData(taskKeys.detail(id)),
});

const restore = (queryClient, snap) => {
  if (!snap) return;
  for (const [key, data] of snap.lists) queryClient.setQueryData(key, data);
  if (snap.detail) queryClient.setQueryData(taskKeys.detail(snap.id), snap.detail);
};

const me = () => {
  const user = useAuthStore.getState().user;
  return (
    user && { id: user.id, name: user.name, username: user.username, avatarUrl: user.avatarUrl }
  );
};

/**
 * После изменения задачи устарели: списки задач, прогресс проекта (шапка, карточка, список).
 * Пока идут другие изменения задач — не перезапрашиваем: ответ сервера ещё не учтёт их,
 * и карточки на миг «прыгнули» бы назад. Обновит последняя завершившаяся мутация.
 */
const useRefreshTaskViews = () => {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  return (projectId) => {
    if (queryClient.isMutating({ mutationKey: taskKeys.all }) > 1) return;
    queryClient.invalidateQueries({ queryKey: taskKeys.all });
    if (projectId) queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.lists(workspaceId) });
  };
};

// ── Мутации ─────────────────────────────────────────────────────────────────

let tempSeq = 0;

/**
 * Создать задачу в проекте. Оптимистично: карточка «черновиком» (pending) сразу
 * появляется в конце колонки, после ответа заменяется настоящей.
 */
export const useCreateTask = (projectId) => {
  const queryClient = useQueryClient();
  const refresh = useRefreshTaskViews();
  const key = taskKeys.project(projectId);

  return useMutation({
    mutationKey: [...taskKeys.all, 'create'],
    mutationFn: (data) => tasksApi.createTask(projectId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const tempId = `temp-${++tempSeq}`;
      const status = data.status ?? 'todo';
      const author = me();
      queryClient.setQueryData(key, (list) =>
        list
          ? {
              ...list,
              items: [
                ...list.items,
                {
                  id: tempId,
                  projectId,
                  title: data.title.trim(),
                  description: null,
                  status,
                  priority: data.priority ?? 'medium',
                  dueDate: null,
                  position: endOfColumn(list.items, status),
                  completedAt: status === 'done' ? new Date().toISOString() : null,
                  createdBy: author?.id ?? null,
                  assignee: author, // сервер по умолчанию назначает автора
                  pending: true,
                },
              ],
            }
          : list,
      );
      return { tempId };
    },
    onSuccess: (task, _data, context) => {
      queryClient.setQueryData(key, (list) =>
        list
          ? { ...list, items: list.items.map((t) => (t.id === context.tempId ? task : t)) }
          : list,
      );
      queryClient.setQueryData(taskKeys.detail(task.id), task);
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(key, (list) =>
        list ? { ...list, items: list.items.filter((t) => t.id !== context?.tempId) } : list,
      );
    },
    onSettled: () => refresh(projectId),
  });
};

/**
 * Изменить поля задачи: { id, projectId, data }. Оптимистично во всех списках и в окне
 * задачи; ошибка — откат (тост показывает вызывающий код).
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const refresh = useRefreshTaskViews();

  return useMutation({
    mutationKey: [...taskKeys.all, 'update'],
    mutationFn: ({ id, data }) => tasksApi.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      const snap = snapshot(queryClient, id);
      const user = me();
      updateLists(queryClient, (items) =>
        items.map((t) => (t.id === id ? patchTask(t, data, { siblings: items, me: user }) : t)),
      );
      queryClient.setQueryData(taskKeys.detail(id), (t) => t && patchTask(t, data, { me: user }));
      return snap;
    },
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), (old) => ({ ...old, ...task }));
      // position не берём: сервер мог перенумеровать колонку, а соседи в кэше — ещё старые
      updateLists(queryClient, (items) =>
        items.map((t) => (t.id === task.id ? { ...t, ...task, position: t.position } : t)),
      );
    },
    onError: (_error, _vars, snap) => restore(queryClient, snap),
    onSettled: (task, _error, vars) => refresh(task?.projectId ?? vars.projectId),
  });
};

/**
 * Перетаскивание на доске: move({ id, status, index }).
 * Кэш меняется СРАЗУ, в том же кадре, что и «отпускание» карточки (иначе она на миг
 * прыгнула бы назад), затем идёт запрос. Ошибка — откат и тост.
 */
export const useMoveTask = (projectId) => {
  const queryClient = useQueryClient();
  const refresh = useRefreshTaskViews();
  const key = taskKeys.project(projectId);
  const apply = (vars) =>
    queryClient.setQueryData(key, (list) =>
      list ? { ...list, items: applyMove(list.items, vars) } : list,
    );

  const mutation = useMutation({
    mutationKey: [...taskKeys.all, 'move'],
    mutationFn: ({ id, status, index }) => tasksApi.moveTask(id, { status, position: index }),
    onMutate: async (vars) => {
      // Отменённый фоновый запрос откатывает кэш к своему началу — применяем ход ещё раз
      await queryClient.cancelQueries({ queryKey: key });
      apply(vars);
      return { previous: vars.previous };
    },
    onSuccess: (task) => {
      // Только окно задачи: позиции в списке обновит перезапрос (см. useUpdateTask)
      queryClient.setQueryData(taskKeys.detail(task.id), (old) => ({ ...old, ...task }));
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error('Карточка вернулась на место', { description: getErrorMessage(error) });
    },
    onSettled: () => refresh(projectId),
  });

  const move = (vars) => {
    const previous = queryClient.getQueryData(key);
    apply(vars);
    mutation.mutate({ ...vars, previous });
  };

  return { ...mutation, move };
};

/** Удалить задачу: { id, projectId }. Оптимистично убираем из списков, ошибка — возвращаем. */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const refresh = useRefreshTaskViews();

  return useMutation({
    mutationKey: [...taskKeys.all, 'delete'],
    mutationFn: ({ id }) => tasksApi.deleteTask(id),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snap = snapshot(queryClient, id);
      updateLists(queryClient, (items) => items.filter((t) => t.id !== id));
      return snap;
    },
    onSuccess: (_res, { id }) => queryClient.removeQueries({ queryKey: taskKeys.detail(id) }),
    onError: (_error, _vars, snap) => restore(queryClient, snap),
    onSettled: (_res, _error, { projectId }) => refresh(projectId),
  });
};
