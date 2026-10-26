import { apiClient } from './client';

/** Поиск → { q, projects, tasks, notes } (по 5 на тип). signal — отменить устаревший запрос. */
export const search = (wsId, q, signal) =>
  apiClient.get(`/workspaces/${wsId}/search`, { params: { q }, signal }).then((res) => res.data);
