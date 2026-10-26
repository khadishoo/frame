import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notesApi from '@/api/notes';
import { favoriteKeys } from '@/features/favorites/hooks/useFavorites';
import { projectKeys } from '@/features/projects/hooks/useProjects';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';

/**
 * Ключи кэша:
 *  ['notes']                   — все списки (для инвалидации)
 *  ['notes', wsId, filters]    — список с фильтрами (страница «Идеи», вкладка проекта)
 *  ['note', id]                — одна заметка (редактор)
 */
export const noteKeys = {
  all: ['notes'],
  list: (wsId, filters) => ['notes', wsId, filters],
  detail: (id) => ['note', id],
};

// Идей у одного человека немного — грузим до 200 разом (пагинация появится, если понадобится)
const LIMIT = 200;

export const useNotes = (filters = {}) => {
  const { workspaceId } = useCurrentWorkspace();
  return useQuery({
    queryKey: noteKeys.list(workspaceId, filters),
    queryFn: () => notesApi.listNotes(workspaceId, { ...filters, limit: LIMIT }),
    enabled: Boolean(workspaceId),
    placeholderData: keepPreviousData,
  });
};

export const useNote = (id) =>
  useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => notesApi.getNote(id),
    enabled: Boolean(id),
    retry: (count, error) => error?.response?.status !== 404 && count < 1,
  });

/** Заменить заметку во всех списках (после ответа сервера). */
const replaceInLists = (queryClient, note) =>
  queryClient.setQueriesData({ queryKey: noteKeys.all }, (data) =>
    data?.items
      ? { ...data, items: data.items.map((n) => (n.id === note.id ? { ...n, ...note } : n)) }
      : data,
  );

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  return useMutation({
    mutationFn: (data) => notesApi.createNote(workspaceId, data),
    onSuccess: (note) => {
      queryClient.setQueryData(noteKeys.detail(note.id), note);
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
};

/**
 * Изменить заметку: { id, data }. Оптимистично в окне редактора и в списках (закрепление
 * и цвет видны сразу); ошибка — откат (тост показывает вызывающий код).
 */
export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => notesApi.updateNote(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.detail(id) });
      const previous = queryClient.getQueryData(noteKeys.detail(id));
      // projectId → project меняет только ответ сервера (нужны название и тип проекта)
      const simple = { ...data };
      delete simple.projectId;
      queryClient.setQueryData(noteKeys.detail(id), (note) => note && { ...note, ...simple });
      return { previous };
    },
    onError: (_error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(noteKeys.detail(id), context.previous);
    },
    onSuccess: (note) => {
      queryClient.setQueryData(noteKeys.detail(note.id), note);
      replaceInLists(queryClient, note);
    },
    // Порядок списка зависит от updated_at и закрепления — пусть сервер пересчитает
    onSettled: () => queryClient.invalidateQueries({ queryKey: noteKeys.all }),
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notesApi.deleteNote(id),
    onSuccess: (_res, id) => {
      queryClient.setQueriesData({ queryKey: noteKeys.all }, (data) =>
        data?.items ? { ...data, items: data.items.filter((n) => n.id !== id) } : data,
      );
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
};

/** «Превратить в проект»: { id, type } → { project, note } */
export const useConvertNote = () => {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  return useMutation({
    mutationFn: ({ id, type }) => notesApi.convertNote(id, type),
    onSuccess: ({ project, note }) => {
      queryClient.setQueryData(noteKeys.detail(note.id), note);
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(workspaceId) });
    },
  });
};
