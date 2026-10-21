import { apiClient } from './client';

// Пустые фильтры не отправляем — адрес запроса короче и кэш-ключ стабильнее
const clean = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
  );

/** → { items, total, limit, offset } */
export const listProjects = (wsId, params) =>
  apiClient.get(`/workspaces/${wsId}/projects`, { params: clean(params) }).then((res) => res.data);

export const getProject = (id) => apiClient.get(`/projects/${id}`).then((res) => res.data);

export const createProject = (wsId, data) =>
  apiClient.post(`/workspaces/${wsId}/projects`, data).then((res) => res.data);

export const updateProject = (id, data) =>
  apiClient.patch(`/projects/${id}`, data).then((res) => res.data);

export const setProjectTags = (id, tagIds) =>
  apiClient.put(`/projects/${id}/tags`, { tagIds }).then((res) => res.data);

export const archiveProject = (id) =>
  apiClient.post(`/projects/${id}/archive`).then((res) => res.data);

export const restoreProject = (id) =>
  apiClient.post(`/projects/${id}/restore`).then((res) => res.data);

export const deleteProject = (id) => apiClient.delete(`/projects/${id}`);
