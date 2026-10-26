import { apiClient } from './client';

// Пустые фильтры не отправляем; списки (status, priority) — через запятую
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '' && v !== null)
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]),
  );

/** Задачи проекта для доски → { items } */
export const listProjectTasks = (projectId, params) =>
  apiClient.get(`/projects/${projectId}/tasks`, { params: clean(params) }).then((res) => res.data);

/** Задачи пространства («Мои задачи», календарь) → { items, total, limit, offset } */
export const listWorkspaceTasks = (wsId, params) =>
  apiClient.get(`/workspaces/${wsId}/tasks`, { params: clean(params) }).then((res) => res.data);

export const getTask = (id) => apiClient.get(`/tasks/${id}`).then((res) => res.data);

export const createTask = (projectId, data) =>
  apiClient.post(`/projects/${projectId}/tasks`, data).then((res) => res.data);

export const updateTask = (id, data) =>
  apiClient.patch(`/tasks/${id}`, data).then((res) => res.data);

/** position — место в колонке после перемещения (0 — наверх) */
export const moveTask = (id, { status, position }) =>
  apiClient.patch(`/tasks/${id}/move`, { status, position }).then((res) => res.data);

export const deleteTask = (id) => apiClient.delete(`/tasks/${id}`);
